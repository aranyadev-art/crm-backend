const mongoose = require("mongoose");
const Shortlist = require("../models/Shortlist");
const User = require("../models/User");
const { logActivity } = require("../services/activityService");


// ========================================
// CREATE SHORTLIST
// ========================================

const createShortlist = async (req, res) => {
  try {
    const {
      userA,
      userB,
      source,
      initiatedBy,
      matchPercentage,
      matchedFields,
      notes,
    } = req.body;

    if (!userA || !userB) {
      return res.status(400).json({
        success: false,
        message: "User A and User B are required",
      });
    }

    if (userA === userB) {
      return res.status(400).json({
        success: false,
        message: "User A and User B cannot be the same user",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userA)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User A ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userB)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User B ID",
      });
    }

    const users = await User.find({
      _id: {
        $in: [userA, userB],
      },
    }).select("_id");

    if (users.length !== 2) {
      return res.status(404).json({
        success: false,
        message: "One or both users not found",
      });
    }

    const existingShortlist = await Shortlist.findOne({
      $or: [
        {
          userA,
          userB,
        },
        {
          userA: userB,
          userB: userA,
        },
      ],
    });

    if (existingShortlist) {
      if (existingShortlist.archived) {
        existingShortlist.archived = false;
        existingShortlist.archivedAt = null;
        existingShortlist.archivedBy = null;
        existingShortlist.status = "SHORTLISTED";

        existingShortlist.statusHistory.push({
          status: "SHORTLISTED",
          changedBy: initiatedBy || null,
          note: "Shortlist reopened",
          changedAt: new Date(),
        });

        await existingShortlist.save();

        const reopenedShortlist =
          await Shortlist.findById(existingShortlist._id)
            .populate("userA", "fullName gender dateOfBirth profilePhoto")
            .populate("userB", "fullName gender dateOfBirth profilePhoto")
            .populate("initiatedBy", "fullName");

        return res.status(200).json({
          success: true,
          message: "Shortlist reopened successfully",
          data: reopenedShortlist,
        });
      }

      return res.status(409).json({
        success: false,
        message: "This pair is already shortlisted",
        data: existingShortlist,
      });
    }

    const shortlist = await Shortlist.create({
      userA,
      userB,
      source: source || "MATCHING",
      status: "SHORTLISTED",
      initiatedBy: initiatedBy || userA,
      matchPercentage:
        matchPercentage !== undefined
          ? matchPercentage
          : null,
      matchedFields: matchedFields || [],
      notes: notes || "",
      statusHistory: [
        {
          status: "SHORTLISTED",
          changedBy: initiatedBy || userA,
          note: notes || "Pair added to shortlist",
          changedAt: new Date(),
        },
      ],
    });
    logActivity({
      action: "CREATED",
      module: "SHORTLIST",
      targetType: "Shortlist",
      targetId: shortlist._id,
      description: "A new pair was added to the shortlist",
      metadata: { source: shortlist.source },
    });


    const populatedShortlist =
      await Shortlist.findById(shortlist._id)
        .populate(
          "userA",
          "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
        )
        .populate(
          "userB",
          "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
        )
        .populate("initiatedBy", "fullName");

    res.status(201).json({
      success: true,
      message: "Pair added to shortlist successfully",
      data: populatedShortlist,
    });
  } catch (error) {
    console.error(
      "Create shortlist error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This pair is already shortlisted",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create shortlist",
      error: error.message,
    });
  }
};


// ========================================
// GET ALL SHORTLISTS
// ========================================

const getShortlists = async (req, res) => {
  try {
    const {
      status,
      source,
      initiatedBy,
      userId,
      archived,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (source) {
      filter.source = source;
    }

    if (initiatedBy) {
      filter.initiatedBy = initiatedBy;
    }

    if (archived !== undefined) {
      filter.archived = archived === "true";
    } else {
      filter.archived = false;
    }

    if (userId) {
      filter.$or = [
        {
          userA: userId,
        },
        {
          userB: userId,
        },
      ];
    }

    const shortlists = await Shortlist.find(filter)
      .populate(
        "userA",
        "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
      )
      .populate(
        "userB",
        "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
      )
      .populate("initiatedBy", "fullName")
      .sort({
        updatedAt: -1,
      });

    res.status(200).json({
      success: true,
      count: shortlists.length,
      data: shortlists,
    });
  } catch (error) {
    console.error(
      "Get shortlists error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch shortlists",
      error: error.message,
    });
  }
};


// ========================================
// GET SINGLE SHORTLIST
// ========================================

const getShortlistById = async (req, res) => {
  try {
    const shortlist =
      await Shortlist.findById(req.params.id)
        .populate(
          "userA",
          "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness maritalStatus height"
        )
        .populate(
          "userB",
          "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness maritalStatus height"
        )
        .populate("initiatedBy", "fullName")
        .populate(
          "statusHistory.changedBy",
          "fullName"
        )
        .populate("archivedBy", "fullName");

    if (!shortlist) {
      return res.status(404).json({
        success: false,
        message: "Shortlist not found",
      });
    }

    res.status(200).json({
      success: true,
      data: shortlist,
    });
  } catch (error) {
    console.error(
      "Get shortlist error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch shortlist",
      error: error.message,
    });
  }
};


// ========================================
// UPDATE SHORTLIST STATUS
// ========================================

const updateShortlistStatus = async (req, res) => {
  try {
    const {
      status,
      changedBy,
      note,
    } = req.body;

    const allowedStatuses = [
      "SHORTLISTED",
      "INTEREST_SENT",
      "INTEREST_RECEIVED",
      "MUTUAL_INTEREST",
      "BIODATA_SHARED",
      "MEETING_SCHEDULED",
      "FINALIZED",
      "DECLINED",
      "NOT_PROCEEDING",
    ];

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shortlist status",
      });
    }

    const shortlist =
      await Shortlist.findById(req.params.id);

    if (!shortlist) {
      return res.status(404).json({
        success: false,
        message: "Shortlist not found",
      });
    }

    const previousStatus = shortlist.status;

    shortlist.status = status;

    shortlist.statusHistory.push({
      status,
      changedBy: changedBy || null,
      note: note || "",
      changedAt: new Date(),
    });

    await shortlist.save();

        logActivity({
      action: "STATUS_CHANGED",
      module: "SHORTLIST",
      targetType: "Shortlist",
      targetId: shortlist._id,
      description: `Shortlist status changed from ${previousStatus} to ${status}`,
      metadata: { oldStatus: previousStatus, newStatus: status },
    });

    const updatedShortlist =
      await Shortlist.findById(shortlist._id)
        .populate(
          "userA",
          "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
        )
        .populate(
          "userB",
          "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
        )
        .populate("initiatedBy", "fullName")
        .populate(
          "statusHistory.changedBy",
          "fullName"
        );

    res.status(200).json({
      success: true,
      message: "Shortlist status updated successfully",
      previousStatus,
      currentStatus: status,
      data: updatedShortlist,
    });
  } catch (error) {
    console.error(
      "Update shortlist status error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to update shortlist status",
      error: error.message,
    });
  }
};


// ========================================
// ADD / UPDATE NOTE
// ========================================

const updateShortlistNote = async (req, res) => {
  try {
    const {
      note,
      changedBy,
    } = req.body;

    if (note === undefined) {
      return res.status(400).json({
        success: false,
        message: "Note is required",
      });
    }

    const shortlist =
      await Shortlist.findById(req.params.id);

    if (!shortlist) {
      return res.status(404).json({
        success: false,
        message: "Shortlist not found",
      });
    }

    shortlist.notes = note;

    shortlist.statusHistory.push({
      status: shortlist.status,
      changedBy: changedBy || null,
      note: note,
      changedAt: new Date(),
    });

    await shortlist.save();

    const updatedShortlist =
      await Shortlist.findById(shortlist._id)
        .populate(
          "userA",
          "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
        )
        .populate(
          "userB",
          "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
        )
        .populate("initiatedBy", "fullName")
        .populate(
          "statusHistory.changedBy",
          "fullName"
        );

    res.status(200).json({
      success: true,
      message: "Shortlist note updated successfully",
      data: updatedShortlist,
    });
  } catch (error) {
    console.error(
      "Update shortlist note error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to update shortlist note",
      error: error.message,
    });
  }
};


// ========================================
// ARCHIVE SHORTLIST
// ========================================

const archiveShortlist = async (req, res) => {
  try {
    const {
      archivedBy,
      note,
    } = req.body;

    const shortlist =
      await Shortlist.findById(req.params.id);

    if (!shortlist) {
      return res.status(404).json({
        success: false,
        message: "Shortlist not found",
      });
    }

    if (shortlist.archived) {
      return res.status(400).json({
        success: false,
        message: "Shortlist is already archived",
      });
    }

    shortlist.archived = true;
    shortlist.archivedAt = new Date();
    shortlist.archivedBy = archivedBy || null;

    shortlist.statusHistory.push({
      status: shortlist.status,
      changedBy: archivedBy || null,
      note: note || "Shortlist archived",
      changedAt: new Date(),
    });

    await shortlist.save();

    res.status(200).json({
      success: true,
      message: "Shortlist archived successfully",
      data: shortlist,
    });
  } catch (error) {
    console.error(
      "Archive shortlist error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to archive shortlist",
      error: error.message,
    });
  }
};


// ========================================
// GET USER SHORTLIST HISTORY
// ========================================

const getUserShortlistHistory = async (req, res) => {
  try {
    const shortlists = await Shortlist.find({
      $or: [
        {
          userA: req.params.userId,
        },
        {
          userB: req.params.userId,
        },
      ],
    })
      .populate(
        "userA",
        "fullName gender dateOfBirth profilePhoto city state district"
      )
      .populate(
        "userB",
        "fullName gender dateOfBirth profilePhoto city state district"
      )
      .populate("initiatedBy", "fullName")
      .sort({
        updatedAt: -1,
      });

    res.status(200).json({
      success: true,
      count: shortlists.length,
      data: shortlists,
    });
  } catch (error) {
    console.error(
      "Get user shortlist history error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch user shortlist history",
      error: error.message,
    });
  }
};


// ========================================
// GET MY SHORTLIST (matrimonial user — self only)
// ========================================
// req.user.userId JWT se aata hai (authMiddleware.protect ke through).
// Koi URL param nahi — user sirf apni hi shortlist entries dekh sakta hai,
// chahe wo userA ho ya userB.

const getMyShortlist = async (req, res) => {
  try {
    const myUserId = req.user.userId;

    const shortlists = await Shortlist.find({
      $or: [
        { userA: myUserId },
        { userB: myUserId },
      ],
      archived: false,
    })
      .populate(
        "userA",
        "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
      )
      .populate(
        "userB",
        "fullName gender dateOfBirth profilePhoto city state district education jobProfessionBusiness"
      )
      .sort({
        updatedAt: -1,
      });

    res.status(200).json({
      success: true,
      count: shortlists.length,
      data: shortlists,
    });
  } catch (error) {
    console.error(
      "Get my shortlist error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch your shortlist",
      error: error.message,
    });
  }
};


module.exports = {
  createShortlist,
  getShortlists,
  getShortlistById,
  updateShortlistStatus,
  updateShortlistNote,
  archiveShortlist,
  getUserShortlistHistory,
  getMyShortlist,
};