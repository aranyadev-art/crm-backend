const Inquiry = require("../models/Inquiry");
const User = require("../models/User");
const Shortlist = require("../models/Shortlist");
const Meeting = require("../models/Meeting");
const Communication = require("../models/Communication");
const Outcome = require("../models/Outcome");
const Task = require("../models/Task");

// =========================
// HELPER: Date Ranges
// =========================

const getMonthRange = (monthsAgo = 0) => {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo,
    1
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo + 1,
    1
  );

  return { start, end };
};

const getTodayRange = () => {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  return { start, end };
};

// =========================
// HELPER: % Change
// =========================

const calculateChange = (current, previous) => {
  if (previous > 0) {
    return ((current - previous) / previous) * 100;
  }

  if (current > 0) {
    return 100;
  }

  return 0;
};

// =========================
// GET DASHBOARD STATS
// =========================

const getDashboardStats = async (req, res) => {
  try {
    const currentMonth = getMonthRange(0);
    const previousMonth = getMonthRange(1);
    const today = getTodayRange();
    const now = new Date();

    const [
      totalInquiries,
      currentMonthInquiries,
      previousMonthInquiries,
      totalUsers,
      currentMonthUsers,
      previousMonthUsers,
      activeMatches,
      currentMonthShortlists,
      previousMonthShortlists,
      meetingsThisMonth,
      meetingsPreviousMonth,
      completedMeetingsCount,
      totalOutcomes,
      successfulOutcomes,
      totalShortlists,
      recentInquiries,
      recentShortlists,
      recentMeetings,
      followUpInquiries,
      followUpCommunications,
      meetingsTodayCount,
      pendingTasksCount,
      overdueTasksCount,
      upcomingMeetingsRaw,
      pendingTasksRaw,
    ] = await Promise.all([
      // Stat cards - Inquiries
      Inquiry.countDocuments({ isArchived: false }),
      Inquiry.countDocuments({
        isArchived: false,
        createdAt: { $gte: currentMonth.start, $lt: currentMonth.end },
      }),
      Inquiry.countDocuments({
        isArchived: false,
        createdAt: { $gte: previousMonth.start, $lt: previousMonth.end },
      }),

      // Stat cards - Users
      User.countDocuments({}),
      User.countDocuments({
        createdAt: { $gte: currentMonth.start, $lt: currentMonth.end },
      }),
      User.countDocuments({
        createdAt: { $gte: previousMonth.start, $lt: previousMonth.end },
      }),

      // Stat cards - Active Matches (Shortlist)
      Shortlist.countDocuments({
        archived: false,
        status: {
          $nin: ["FINALIZED", "DECLINED", "NOT_PROCEEDING"],
        },
      }),
      Shortlist.countDocuments({
        archived: false,
        createdAt: { $gte: currentMonth.start, $lt: currentMonth.end },
      }),
      Shortlist.countDocuments({
        archived: false,
        createdAt: { $gte: previousMonth.start, $lt: previousMonth.end },
      }),

      // Stat cards - Meetings
      Meeting.countDocuments({
        archived: false,
        meetingDate: { $gte: currentMonth.start, $lt: currentMonth.end },
      }),
      Meeting.countDocuments({
        archived: false,
        meetingDate: { $gte: previousMonth.start, $lt: previousMonth.end },
      }),

      // Pipeline - completed meetings
      Meeting.countDocuments({ status: "COMPLETED", archived: false }),

      // Success rate + Pipeline "Finalized" — from Outcome
      Outcome.countDocuments({ archived: false }),
      Outcome.countDocuments({
        archived: false,
        status: { $in: ["MARRIED", "ENGAGED"] },
      }),

      Shortlist.countDocuments({ archived: false }),

      // Milestones / Recent Activity (raw data, merged below)
      Inquiry.find({ isArchived: false })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("fullName source createdAt"),

      Shortlist.find({ archived: false })
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate("userA", "fullName")
        .populate("userB", "fullName")
        .select("userA userB status statusHistory updatedAt"),

      Meeting.find({ archived: false })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("userA", "fullName")
        .populate("userB", "fullName")
        .select("userA userB status createdAt"),

      // Follow-ups: due today OR overdue (before today)
      Inquiry.find({
        isArchived: false,
        followUpRequired: true,
        nextFollowUpDate: { $lt: today.end },
      })
        .sort({ nextFollowUpDate: 1 })
        .limit(10)
        .select("fullName notes nextFollowUpDate"),

      Communication.find({
        followUpRequired: true,
        nextFollowUpDate: { $lt: today.end },
      })
        .sort({ nextFollowUpDate: 1 })
        .limit(10)
        .populate("user", "fullName")
        .select("user type notes nextFollowUpDate"),

      // Today's Priorities counts
      Meeting.countDocuments({
        archived: false,
        status: "SCHEDULED",
        meetingDate: { $gte: today.start, $lt: today.end },
      }),

      Task.countDocuments({
        archived: false,
        status: { $in: ["TODO", "IN_PROGRESS"] },
      }),

      Task.countDocuments({
        archived: false,
        status: { $in: ["TODO", "IN_PROGRESS"] },
        dueDate: { $lt: today.start },
      }),

      // Upcoming Meetings widget — next 5 scheduled meetings from now
      Meeting.find({
        archived: false,
        status: "SCHEDULED",
        meetingDate: { $gte: now },
      })
        .sort({ meetingDate: 1 })
        .limit(5)
        .populate("userA", "fullName")
        .populate("userB", "fullName")
        .select("userA userB meetingDate type location status"),

      // Pending Tasks widget — top 5 pending tasks
      Task.find({
        archived: false,
        status: { $in: ["TODO", "IN_PROGRESS"] },
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .select("title dueDate priority status"),
    ]);

    // =========================
    // % CHANGES
    // =========================

    const inquiriesChange = calculateChange(
      currentMonthInquiries,
      previousMonthInquiries
    );

    const usersChange = calculateChange(
      currentMonthUsers,
      previousMonthUsers
    );

    const matchesChange = calculateChange(
      currentMonthShortlists,
      previousMonthShortlists
    );

    const meetingsChange = calculateChange(
      meetingsThisMonth,
      meetingsPreviousMonth
    );

    // =========================
    // SUCCESS RATE (based on Outcome)
    // =========================

    const hasEnoughData = totalOutcomes > 0;

    const successRate = hasEnoughData
      ? (successfulOutcomes / totalOutcomes) * 100
      : 0;

    // =========================
    // BUILD RECENT ACTIVITY (from milestones)
    // =========================

    const milestones = [];

    recentInquiries.forEach((inquiry) => {
      milestones.push({
        type: "INQUIRY",
        text: `New lead ${inquiry.fullName} via ${inquiry.source}`,
        date: inquiry.createdAt,
      });
    });

    recentShortlists.forEach((shortlist) => {
      const nameA = shortlist.userA?.fullName || "Someone";
      const nameB = shortlist.userB?.fullName || "someone";

      milestones.push({
        type: "SHORTLIST",
        text: `${nameA} & ${nameB} → ${shortlist.status.replace(/_/g, " ")}`,
        date: shortlist.updatedAt,
      });
    });

    recentMeetings.forEach((meeting) => {
      const nameA = meeting.userA?.fullName || "Someone";
      const nameB = meeting.userB?.fullName || "someone";

      const text =
        meeting.status === "COMPLETED"
          ? `Meeting completed for ${nameA} & ${nameB}`
          : `Meeting scheduled for ${nameA} & ${nameB}`;

      milestones.push({
        type: "MEETING",
        text,
        date: meeting.createdAt,
      });
    });

    milestones.sort((a, b) => new Date(b.date) - new Date(a.date));

    const recentMilestones = milestones.slice(0, 6);

    // =========================
    // BUILD FOLLOW-UPS LIST (with Due/Overdue status)
    // =========================

    const buildFollowUpStatus = (date) => {
      return new Date(date) < today.start ? "OVERDUE" : "DUE";
    };

    const todaysFollowUps = [
      ...followUpInquiries.map((inquiry) => ({
        name: inquiry.fullName,
        action: inquiry.notes || "Follow-up call",
        source: "INQUIRY",
        dueDate: inquiry.nextFollowUpDate,
        status: buildFollowUpStatus(inquiry.nextFollowUpDate),
        link: "/inquiries",
      })),
      ...followUpCommunications.map((comm) => ({
        name: comm.user?.fullName || "Unknown",
        action: `${comm.type} follow-up`,
        source: "COMMUNICATION",
        dueDate: comm.nextFollowUpDate,
        status: buildFollowUpStatus(comm.nextFollowUpDate),
        link: "/communication",
      })),
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // =========================
    // BUILD UPCOMING MEETINGS
    // =========================

    const upcomingMeetings = upcomingMeetingsRaw.map((meeting) => ({
      id: meeting._id,
      nameA: meeting.userA?.fullName || "Someone",
      nameB: meeting.userB?.fullName || "someone",
      meetingDate: meeting.meetingDate,
      type: meeting.type,
      location: meeting.location,
    }));

    // =========================
    // BUILD PENDING TASKS
    // =========================

    const pendingTasksList = pendingTasksRaw.map((task) => ({
      id: task._id,
      title: task.title,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      isOverdue: task.dueDate ? new Date(task.dueDate) < today.start : false,
    }));

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      success: true,
      data: {
        stats: {
          newInquiries: {
            value: totalInquiries,
            change: Math.abs(inquiriesChange).toFixed(1),
            trend: inquiriesChange >= 0 ? "up" : "down",
          },
          activeProfiles: {
            value: totalUsers,
            change: Math.abs(usersChange).toFixed(1),
            trend: usersChange >= 0 ? "up" : "down",
          },
          activeMatches: {
            value: activeMatches,
            change: Math.abs(matchesChange).toFixed(1),
            trend: matchesChange >= 0 ? "up" : "down",
          },
          meetingsThisMonth: {
            value: meetingsThisMonth,
            change: Math.abs(meetingsChange).toFixed(1),
            trend: meetingsChange >= 0 ? "up" : "down",
          },
        },
        successRate: {
          rate: successRate.toFixed(1),
          hasEnoughData,
          breakdown: {
            successfulOutcomes,
            totalOutcomes,
            inProgress: totalShortlists - successfulOutcomes,
          },
        },
        pipeline: {
          inquiries: totalInquiries,
          users: totalUsers,
          matched: totalShortlists,
          met: completedMeetingsCount,
          finalized: successfulOutcomes,
        },
        recentMilestones,
        todaysFollowUps,
        todaysPriorities: {
          followUpsDue: todaysFollowUps.length,
          meetingsToday: meetingsTodayCount,
          pendingTasks: pendingTasksCount,
          overdueItems: overdueTasksCount,
        },
        upcomingMeetings,
        pendingTasksList,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};