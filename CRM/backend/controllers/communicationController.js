const Communication = require("../models/Communication");
const { logActivity } = require("../services/activityService");

// ========================================
// CREATE COMMUNICATION
// ========================================

const createCommunication = async (req, res) => {
  try {
    const communication =
      await Communication.create(req.body);

    logActivity({
      action: "CREATED",
      module: "COMMUNICATION",
      targetType: "Communication",
      targetId: communication._id,
      description: `${communication.type} communication logged`,
      user: communication.user,
      metadata: { type: communication.type, direction: communication.direction },
    });

    const createdCommunication =
      await Communication.findById(
        communication._id
      )
        .populate(
          "user",
          "fullName gender profilePhoto city state"
        )
        .populate(
          "shortlist"
        )
        .populate(
          "biodata"
        )
        .populate(
          "contactedBy",
          "fullName"
        );

    res.status(201).json({
      success: true,
      message:
        "Communication created successfully",
      data: createdCommunication,
    });
  } catch (error) {
    console.error(
      "Create communication error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to create communication",
      error: error.message,
    });
  }
};


// ========================================
// GET ALL COMMUNICATIONS
// ========================================

const getCommunications = async (req, res) => {
  try {
    const {
      user,
      shortlist,
      type,
      status,
      followUpRequired,
    } = req.query;

    const filter = {};

    if (user) {
      filter.user = user;
    }

    if (shortlist) {
      filter.shortlist = shortlist;
    }

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (
      followUpRequired !== undefined
    ) {
      filter.followUpRequired =
        followUpRequired === "true";
    }

    const communications =
      await Communication.find(filter)
        .populate(
          "user",
          "fullName gender profilePhoto city state"
        )
        .populate("shortlist")
        .populate("biodata")
        .populate(
          "contactedBy",
          "fullName"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count: communications.length,
      data: communications,
    });
  } catch (error) {
    console.error(
      "Get communications error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch communications",
      error: error.message,
    });
  }
};


// ========================================
// GET SINGLE COMMUNICATION
// ========================================

const getCommunicationById =
  async (req, res) => {
    try {
      const communication =
        await Communication.findById(
          req.params.id
        )
          .populate(
            "user",
            "fullName gender profilePhoto city state"
          )
          .populate("shortlist")
          .populate("biodata")
          .populate(
            "contactedBy",
            "fullName"
          );

      if (!communication) {
        return res.status(404).json({
          success: false,
          message:
            "Communication not found",
        });
      }

      res.status(200).json({
        success: true,
        data: communication,
      });
    } catch (error) {
      console.error(
        "Get communication error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch communication",
        error: error.message,
      });
    }
  };


// ========================================
// GET MY COMMUNICATIONS (SELF-SCOPED, FOR MATRIMONIAL USER)
// ========================================
// Identity comes ONLY from req.user.userId (set by protect middleware
// after verifying JWT) - never from a URL param or request body.

const getMyCommunications =
  async (req, res) => {
    try {
      const myUserId = req.user.userId;

      const communications =
        await Communication.find({
          user: myUserId,
        })
          .populate("shortlist")
          .populate("biodata")
          .populate(
            "contactedBy",
            "fullName"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,
        count: communications.length,
        data: communications,
      });
    } catch (error) {
      console.error(
        "Get my communications error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch your communications",
        error: error.message,
      });
    }
  };


// ========================================
// UPDATE COMMUNICATION
// ========================================

const updateCommunication =
  async (req, res) => {
    try {
      const communication =
        await Communication.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        )
          .populate(
            "user",
            "fullName gender profilePhoto city state"
          )
          .populate("shortlist")
          .populate("biodata")
          .populate(
            "contactedBy",
            "fullName"
          );

      if (!communication) {
        return res.status(404).json({
          success: false,
          message:
            "Communication not found",
        });
      }

      res.status(200).json({
        success: true,
        message:
          "Communication updated successfully",
        data: communication,
      });
    } catch (error) {
      console.error(
        "Update communication error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update communication",
        error: error.message,
      });
    }
  };


// ========================================
// DELETE COMMUNICATION
// ========================================

const deleteCommunication =
  async (req, res) => {
    try {
      const communication =
        await Communication.findByIdAndDelete(
          req.params.id
        );

      if (!communication) {
        return res.status(404).json({
          success: false,
          message:
            "Communication not found",
        });
      }

      res.status(200).json({
        success: true,
        message:
          "Communication deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete communication error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete communication",
        error: error.message,
      });
    }
  };


module.exports = {
  createCommunication,
  getCommunications,
  getCommunicationById,
  getMyCommunications,
  updateCommunication,
  deleteCommunication,
};