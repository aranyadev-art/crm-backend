// backend/controllers/outcomeController.js

const Outcome = require("../models/Outcome");
const User = require("../models/User");
const { logActivity } = require("../services/activityService");


// ========================================
// CREATE OUTCOME
// ========================================

const createOutcome = async (req, res) => {
  try {

    const outcome = await Outcome.create(req.body);
        logActivity({
      action: "CREATED",
      module: "OUTCOME",
      targetType: "Outcome",
      targetId: outcome._id,
      description: `A new outcome record was created (${outcome.status})`,
      metadata: { status: outcome.status },
    });

    res.status(201).json({
      success: true,
      message: "Outcome created successfully",
      data: outcome,
    });

  } catch (error) {

    console.error("Create outcome error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create outcome",
      error: error.message,
    });
  }
};


// ========================================
// GET ALL OUTCOMES (with filters)
// ========================================

const getOutcomes = async (req, res) => {
  try {

    const {
      status,
      assignedStaff,
      search,
      startDate,
      endDate,
    } = req.query;

    const filter = { archived: false };

    if (status) {
      filter.status = status;
    }

    if (assignedStaff) {
      filter.assignedStaff = assignedStaff;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    let outcomes = await Outcome.find(filter)
      .populate("userA", "fullName contactNo city")
      .populate("userB", "fullName contactNo city")
      .populate("shortlist")
      .populate("meetings")
      .sort({ createdAt: -1 });

    // Search by user name — done after populate since it's a joined field
    if (search) {

      const searchLower = search.toLowerCase();

      outcomes = outcomes.filter((outcome) => {

        const nameA = outcome.userA?.fullName?.toLowerCase() || "";
        const nameB = outcome.userB?.fullName?.toLowerCase() || "";

        return (
          nameA.includes(searchLower) ||
          nameB.includes(searchLower)
        );

      });

    }

    res.status(200).json({
      success: true,
      count: outcomes.length,
      data: outcomes,
    });

  } catch (error) {

    console.error("Get outcomes error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch outcomes",
      error: error.message,
    });
  }
};


// ========================================
// GET SINGLE OUTCOME
// ========================================

const getOutcomeById = async (req, res) => {
  try {

    const outcome = await Outcome.findById(req.params.id)
      .populate("userA")
      .populate("userB")
      .populate("shortlist")
      .populate("meetings");

    if (!outcome) {
      return res.status(404).json({
        success: false,
        message: "Outcome not found",
      });
    }

    res.status(200).json({
      success: true,
      data: outcome,
    });

  } catch (error) {

    console.error("Get outcome error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch outcome",
      error: error.message,
    });
  }
};


// ========================================
// GET MY OUTCOMES (SELF-SCOPED, FOR MATRIMONIAL USER)
// ========================================
// Identity comes ONLY from req.user.userId (set by protect middleware
// after verifying JWT) - never from a URL param or request body.
// Returns outcomes where the logged-in user is either userA or userB.

const getMyOutcomes = async (req, res) => {
  try {

    const myUserId = req.user.userId;

    const outcomes = await Outcome.find({
      $or: [
        { userA: myUserId },
        { userB: myUserId },
      ],
      archived: false,
    })
      .populate("userA", "fullName contactNo city")
      .populate("userB", "fullName contactNo city")
      .populate("shortlist")
      .populate("meetings")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: outcomes.length,
      data: outcomes,
    });

  } catch (error) {

    console.error("Get my outcomes error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your outcomes",
      error: error.message,
    });
  }
};


// ========================================
// UPDATE OUTCOME
// ========================================

const updateOutcome = async (req, res) => {
  try {

    const existingOutcome = await Outcome.findById(req.params.id);

    if (!existingOutcome) {
      return res.status(404).json({
        success: false,
        message: "Outcome not found",
      });
    }

    const previousStatus = existingOutcome.status;

    const outcome = await Outcome.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("userA", "fullName contactNo city")
      .populate("userB", "fullName contactNo city");

    const statusChanged =
      req.body.status && req.body.status !== previousStatus;

    logActivity({
      action: statusChanged ? "STATUS_CHANGED" : "UPDATED",
      module: "OUTCOME",
      targetType: "Outcome",
      targetId: outcome._id,
      description: statusChanged
        ? `Outcome status changed from ${previousStatus} to ${outcome.status}`
        : "Outcome record was updated",
      metadata: statusChanged
        ? { oldStatus: previousStatus, newStatus: outcome.status }
        : {},
    });

    res.status(200).json({
      success: true,
      message: "Outcome updated successfully",
      data: outcome,
    });

  } catch (error) {

    console.error("Update outcome error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update outcome",
      error: error.message,
    });
  }
};


// ========================================
// DELETE OUTCOME (soft-delete / archive)
// ========================================

const deleteOutcome = async (req, res) => {
  try {

    const outcome = await Outcome.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    );

    if (!outcome) {
      return res.status(404).json({
        success: false,
        message: "Outcome not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Outcome archived successfully",
    });

  } catch (error) {

    console.error("Delete outcome error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to archive outcome",
      error: error.message,
    });
  }
};


module.exports = {
  createOutcome,
  getOutcomes,
  getOutcomeById,
  getMyOutcomes,
  updateOutcome,
  deleteOutcome,
};