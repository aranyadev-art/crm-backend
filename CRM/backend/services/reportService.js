// backend/services/reportService.js

const Inquiry = require("../models/Inquiry");
const User = require("../models/User");
const Shortlist = require("../models/Shortlist");
const Biodata = require("../models/Biodata");
const Meeting = require("../models/Meeting");
const Communication = require("../models/Communication");

// ========================================
// DATE RANGE HELPER
// ========================================
// "range" query param ko actual startDate/endDate mein convert karta hai.
// Agar range="custom" hai, to startDate/endDate query se directly liye jaate hain.

const getDateRange = (range, startDate, endDate) => {
  const now = new Date();

  // Custom range — directly use kiya jayega
  if (range === "custom" && startDate && endDate) {
    return {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  }

  // Today — aaj ki midnight se abhi tak
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }

  // This Week — is hafte ke Sunday se abhi tak
  if (range === "thisWeek") {
    const start = new Date(now);
    const day = start.getDay(); // 0 = Sunday
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }

  // This Month — is mahine ki 1 tareek se abhi tak
  if (range === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: now };
  }

  // Last Month — pichhle mahine ki poori range
  if (range === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }

  // Default — koi range nahi (all-time data)
  return null;
};

// ========================================
// BUILD MONGOOSE DATE FILTER
// ========================================
// getDateRange() se mile start/end ko Mongoose query filter mein convert karta hai.
// Agar range null hai (all-time), to empty filter return hota hai (koi restriction nahi).

const buildDateFilter = (dateField, range, startDate, endDate) => {
  const dateRange = getDateRange(range, startDate, endDate);

  if (!dateRange) {
    return {};
  }

  return {
    [dateField]: {
      $gte: dateRange.start,
      $lte: dateRange.end,
    },
  };
};

// ========================================
// OVERVIEW METRICS
// ========================================
// Sabhi key business metrics ek response mein.
// Har count apne model se independently nikala jaata hai.

const getOverviewMetrics = async ({ range, startDate, endDate }) => {

  const inquiryFilter = buildDateFilter("createdAt", range, startDate, endDate);
  const userFilter = buildDateFilter("createdAt", range, startDate, endDate);
  const shortlistFilter = buildDateFilter("createdAt", range, startDate, endDate);
  const biodataFilter = buildDateFilter("createdAt", range, startDate, endDate);
  const meetingFilter = buildDateFilter("createdAt", range, startDate, endDate);
  const communicationFilter = buildDateFilter("createdAt", range, startDate, endDate);

  const [
    totalInquiries,
    convertedInquiries,
    totalUsers,
    totalShortlists,
    mutualInterestCount,
    finalizedCount,
    biodataSharedCount,
    totalMeetings,
    completedMeetings,
    totalCommunications,
  ] = await Promise.all([
    Inquiry.countDocuments(inquiryFilter),
    Inquiry.countDocuments({ ...inquiryFilter, status: "CONVERTED" }),
    User.countDocuments(userFilter),
    Shortlist.countDocuments(shortlistFilter),
    Shortlist.countDocuments({ ...shortlistFilter, status: "MUTUAL_INTEREST" }),
    Shortlist.countDocuments({ ...shortlistFilter, status: "FINALIZED" }),
    Biodata.countDocuments({ ...biodataFilter, status: "SHARED" }),
    Meeting.countDocuments(meetingFilter),
    Meeting.countDocuments({ ...meetingFilter, status: "COMPLETED" }),
    Communication.countDocuments(communicationFilter),
  ]);

  return {
    totalInquiries,
    convertedInquiries,
    totalUsers,
    totalShortlists,
    mutualInterestCount,
    finalizedCount,
    biodataSharedCount,
    totalMeetings,
    completedMeetings,
    totalCommunications,
  };
};


// ========================================
// CONVERSION FUNNEL
// ========================================
// Business funnel: Inquiry -> User -> Shortlist -> Mutual Interest
// -> Biodata Shared -> Meeting -> Finalized
// Har stage "kitne is stage tak pahunche" batata hai (cumulative nahi,
// current status ke basis par count).

const getConversionFunnel = async ({ range, startDate, endDate }) => {

  const inquiryFilter = buildDateFilter("createdAt", range, startDate, endDate);
  const userFilter = buildDateFilter("createdAt", range, startDate, endDate);
  const shortlistFilter = buildDateFilter("createdAt", range, startDate, endDate);
  const biodataFilter = buildDateFilter("createdAt", range, startDate, endDate);
  const meetingFilter = buildDateFilter("createdAt", range, startDate, endDate);

  const [
    totalInquiries,
    totalUsers,
    totalShortlists,
    mutualInterest,
    biodataShared,
    meetingsScheduled,
    finalized,
  ] = await Promise.all([
    Inquiry.countDocuments(inquiryFilter),
    User.countDocuments(userFilter),
    Shortlist.countDocuments(shortlistFilter),
    Shortlist.countDocuments({ ...shortlistFilter, status: "MUTUAL_INTEREST" }),
    Biodata.countDocuments({ ...biodataFilter, status: "SHARED" }),
    Meeting.countDocuments(meetingFilter),
    Shortlist.countDocuments({ ...shortlistFilter, status: "FINALIZED" }),
  ]);

  return [
    { stage: "Inquiry", count: totalInquiries },
    { stage: "User", count: totalUsers },
    { stage: "Shortlist", count: totalShortlists },
    { stage: "Mutual Interest", count: mutualInterest },
    { stage: "Biodata Shared", count: biodataShared },
    { stage: "Meeting Scheduled", count: meetingsScheduled },
    { stage: "Finalized", count: finalized },
  ];
};
module.exports = {
  getDateRange,
  buildDateFilter,
  getOverviewMetrics,
  getConversionFunnel,
};