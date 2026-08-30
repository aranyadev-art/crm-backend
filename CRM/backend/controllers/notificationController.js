const Inquiry = require("../models/Inquiry");
const User = require("../models/User");
const Shortlist = require("../models/Shortlist");
const Meeting = require("../models/Meeting");
const Biodata = require("../models/Biodata");
const Communication = require("../models/Communication");
const Outcome = require("../models/Outcome");

// =========================
// GET RECENT NOTIFICATIONS
// =========================

const getRecentNotifications = async (req, res) => {
  try {
    const [
      inquiries,
      users,
      shortlists,
      meetings,
      biodatas,
      communications,
      outcomes,
    ] = await Promise.all([
      Inquiry.find({ isArchived: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("fullName source createdAt"),

      User.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select("fullName createdAt"),

      Shortlist.find({ archived: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userA", "fullName")
        .populate("userB", "fullName")
        .select("userA userB createdAt"),

      Meeting.find({ archived: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userA", "fullName")
        .populate("userB", "fullName")
        .select("userA userB createdAt"),

      Biodata.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "fullName")
        .select("user createdAt"),

      Communication.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "fullName")
        .select("user type createdAt"),


      Outcome.find({ archived: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userA", "fullName")
        .populate("userB", "fullName")
        .select("userA userB status createdAt"),
    ]);

    const notifications = [];

    // =========================
    // MAP INQUIRIES
    // =========================

    inquiries.forEach((item) => {
      notifications.push({
        id: `inquiry-${item._id}`,
        type: "INQUIRY",
        title: "New inquiry",
        message: `${item.fullName} via ${item.source}`,
        createdAt: item.createdAt,
        link: "/inquiries",
      });
    });

    // =========================
    // MAP USERS
    // =========================

    users.forEach((item) => {
      notifications.push({
        id: `user-${item._id}`,
        type: "USER",
        title: "New profile",
        message: `${item.fullName} joined as a user`,
        createdAt: item.createdAt,
        link: "/users",
      });
    });

    // =========================
    // MAP SHORTLISTS
    // =========================

    shortlists.forEach((item) => {
      const nameA = item.userA?.fullName || "Someone";
      const nameB = item.userB?.fullName || "someone";

      notifications.push({
        id: `shortlist-${item._id}`,
        type: "SHORTLIST",
        title: "New shortlist",
        message: `${nameA} & ${nameB} were shortlisted`,
        createdAt: item.createdAt,
        link: "/shortlist",
      });
    });

    // =========================
    // MAP MEETINGS
    // =========================

    meetings.forEach((item) => {
      const nameA = item.userA?.fullName || "Someone";
      const nameB = item.userB?.fullName || "someone";

      notifications.push({
        id: `meeting-${item._id}`,
        type: "MEETING",
        title: "New meeting",
        message: `Meeting scheduled for ${nameA} & ${nameB}`,
        createdAt: item.createdAt,
        link: "/meetings",
      });
    });

    // =========================
    // MAP BIODATAS
    // =========================

    biodatas.forEach((item) => {
      const name = item.user?.fullName || "a profile";

      notifications.push({
        id: `biodata-${item._id}`,
        type: "BIODATA",
        title: "New biodata",
        message: `Biodata created for ${name}`,
        createdAt: item.createdAt,
        link: "/biodata",
      });
    });

    // =========================
    // MAP COMMUNICATIONS
    // =========================

    communications.forEach((item) => {
      const name = item.user?.fullName || "a profile";

      notifications.push({
        id: `communication-${item._id}`,
        type: "COMMUNICATION",
        title: "New communication",
        message: `${item.type} logged for ${name}`,
        createdAt: item.createdAt,
        link: "/communication",
      });
    });

        // =========================
    // MAP OUTCOMES
    // =========================

    outcomes.forEach((item) => {
      const nameA = item.userA?.fullName || "Someone";
      const nameB = item.userB?.fullName || "someone";

      notifications.push({
        id: `outcome-${item._id}`,
        type: "OUTCOME",
        title: "Outcome updated",
        message: `${nameA} & ${nameB} — ${item.status.replaceAll("_", " ")}`,
        createdAt: item.createdAt,
        link: "/outcomes",
      });
    });

    // =========================
    // SORT + LIMIT
    // =========================

    notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const recentNotifications = notifications.slice(0, 20);

    res.status(200).json({
      success: true,
      data: recentNotifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getRecentNotifications,
};