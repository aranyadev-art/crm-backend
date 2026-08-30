const mongoose = require("mongoose");
const Meeting = require("../models/Meeting");
const Shortlist = require("../models/Shortlist");
const { logActivity } = require("../services/activityService");


// ========================================
// CREATE MEETING
// ========================================

const createMeeting = async (req, res) => {
  try {
    const {
      shortlist,
      meetingDate,
      type,
      location,
      notes,
      followUpRequired,
      nextFollowUpDate,
    } = req.body;

    if (!shortlist) {
      return res.status(400).json({
        success: false,
        message: "Shortlist reference is required",
      });
    }

    if (!meetingDate) {
      return res.status(400).json({
        success: false,
        message: "Meeting date is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shortlist)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Shortlist ID",
      });
    }

    const existingShortlist = await Shortlist.findById(
      shortlist
    );

    if (!existingShortlist) {
      return res.status(404).json({
        success: false,
        message: "Shortlist not found",
      });
    }

    if (!existingShortlist) {
      return res.status(404).json({
        success: false,
        message: "Shortlist not found",
      });
    }

    // Prevent duplicate active meeting for the same pair
    const existingScheduledMeeting = await Meeting.findOne({
      shortlist,
      status: "SCHEDULED",
      archived: false,
    });

    if (existingScheduledMeeting) {
      return res.status(409).json({
        success: false,
        message:
          "This pair already has a scheduled meeting. Please update or cancel it before creating a new one.",
      });
    }

    const meeting = await Meeting.create({
      shortlist,
      userA: existingShortlist.userA,
      userB: existingShortlist.userB,
      meetingDate,
      type: type || "IN_PERSON",
      location: location || "",
      status: "SCHEDULED",
      notes: notes || "",
      followUpRequired: followUpRequired || false,
      nextFollowUpDate: nextFollowUpDate || null,
    });

        logActivity({
      action: "CREATED",
      module: "MEETING",
      targetType: "Meeting",
      targetId: meeting._id,
      description: "A new meeting was scheduled",
      metadata: { meetingDate, type: type || "IN_PERSON" },
    });

    // Keep Shortlist in sync
    existingShortlist.status = "MEETING_SCHEDULED";

    existingShortlist.statusHistory.push({
      status: "MEETING_SCHEDULED",
      changedBy: null,
      note: "Meeting scheduled",
      changedAt: new Date(),
    });

    await existingShortlist.save();

    const populatedMeeting = await Meeting.findById(
      meeting._id
    )
      .populate("shortlist")
      .populate("userA", "fullName")
      .populate("userB", "fullName");

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      data: populatedMeeting,
    });
  } catch (error) {
    console.error("Create meeting error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create meeting",
      error: error.message,
    });
  }
};

// ========================================
// GET ALL MEETINGS
// ========================================

const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      archived: false,
    })
      .populate("shortlist")
      .populate("userA", "fullName")
      .populate("userB", "fullName")
      .sort({ meetingDate: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    console.error("Get meetings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch meetings",
      error: error.message,
    });
  }
};


// ========================================
// GET MEETING BY ID
// ========================================

const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(
      req.params.id
    )
      .populate("shortlist")
      .populate("userA", "fullName")
      .populate("userB", "fullName");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    console.error("Get meeting by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch meeting",
      error: error.message,
    });
  }
};


// ========================================
// GET MEETINGS BY SHORTLIST
// ========================================

const getMeetingsByShortlist = async (
  req,
  res
) => {
  try {
    const meetings = await Meeting.find({
      shortlist: req.params.shortlistId,
      archived: false,
    })
      .populate("shortlist")
      .populate("userA", "fullName")
      .populate("userB", "fullName")
      .sort({ meetingDate: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    console.error(
      "Get shortlist meetings error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch shortlist meetings",
      error: error.message,
    });
  }
};


// ========================================
// GET MY MEETINGS (SELF-SCOPED, FOR MATRIMONIAL USER)
// ========================================
// Identity comes ONLY from req.user.userId (set by protect middleware
// after verifying JWT) - never from a URL param or request body.
// Returns meetings where the logged-in user is either userA or userB.

const getMyMeetings = async (req, res) => {
  try {
    const myUserId = req.user.userId;

    const meetings = await Meeting.find({
      $or: [
        { userA: myUserId },
        { userB: myUserId },
      ],
      archived: false,
    })
      .populate("shortlist")
      .populate("userA", "fullName")
      .populate("userB", "fullName")
      .sort({ meetingDate: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    console.error(
      "Get my meetings error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch your meetings",
      error: error.message,
    });
  }
};


// ========================================
// UPDATE MEETING STATUS
// ========================================
const updateMeetingStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    const existingMeeting = await Meeting.findById(req.params.id);

    if (!existingMeeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const previousStatus = existingMeeting.status;

    const meeting =
      await Meeting.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("shortlist")
        .populate("userA", "fullName")
        .populate("userB", "fullName");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    logActivity({
      action: "STATUS_CHANGED",
      module: "MEETING",
      targetType: "Meeting",
      targetId: meeting._id,
      description: `Meeting status changed from ${previousStatus} to ${status}`,
      metadata: { oldStatus: previousStatus, newStatus: status },
    });

    res.status(200).json({
      success: true,
      message: "Meeting status updated successfully",
      data: meeting,
    });
  } catch (error) {
    console.error(
      "Update meeting status error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update meeting status",
      error: error.message,
    });
  }
};


// ========================================
// ARCHIVE MEETING
// ========================================

const archiveMeeting = async (req, res) => {
  try {
    const meeting =
      await Meeting.findByIdAndUpdate(
        req.params.id,
        { archived: true },
        {
          new: true,
        }
      );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Meeting archived successfully",
      data: meeting,
    });
  } catch (error) {
    console.error(
      "Archive meeting error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to archive meeting",
      error: error.message,
    });
  }
};


module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  getMeetingsByShortlist,
  getMyMeetings,
  updateMeetingStatus,
  archiveMeeting,
};