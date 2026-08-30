const PartnerPreference = require("../models/PartnerPreference");
const { logActivity } = require("../services/activityService");

// ========================================
// CREATE PARTNER PREFERENCE
// ========================================

const createPartnerPreference = async (req, res) => {
  try {
    const preference = await PartnerPreference.create(req.body);

        logActivity({
      action: "CREATED",
      module: "PARTNER_PREFERENCE",
      targetType: "PartnerPreference",
      targetId: preference._id,
      description: "Partner preference was created",
      user: preference.userId || null,
    });

    res.status(201).json({
      success: true,
      message: "Partner preference created successfully",
      data: preference,
    });
  } catch (error) {
    console.error(
      "Create partner preference error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to create partner preference",
      error: error.message,
    });
  }
};


// ========================================
// GET ALL PARTNER PREFERENCES
// ========================================

const getPartnerPreferences = async (req, res) => {
  try {
    const preferences = await PartnerPreference.find()
      .populate("userId", "fullName")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: preferences.length,
      data: preferences,
    });
  } catch (error) {
    console.error(
      "Get partner preferences error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch partner preferences",
      error: error.message,
    });
  }
};


// ========================================
// UPDATE PARTNER PREFERENCE
// ========================================

const updatePartnerPreference = async (req, res) => {
  try {
    const preference =
      await PartnerPreference.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      ).populate("userId", "fullName");

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: "Partner preference not found",
      });
    }
        logActivity({
      action: "UPDATED",
      module: "PARTNER_PREFERENCE",
      targetType: "PartnerPreference",
      targetId: preference._id,
      description: "Partner preference was updated",
      user: preference.userId || null,
    });

    res.status(200).json({
      success: true,
      message: "Partner preference updated successfully",
      data: preference,
    });

  } catch (error) {
    console.error(
      "Update partner preference error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to update partner preference",
      error: error.message,
    });
  }
};


// ========================================
// DELETE PARTNER PREFERENCE
// ========================================

const deletePartnerPreference = async (req, res) => {
  try {
    const preference =
      await PartnerPreference.findByIdAndDelete(
        req.params.id
      );

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: "Partner preference not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Partner preference deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete partner preference error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete partner preference",
      error: error.message,
    });
  }
};


// ========================================
// GET MY PARTNER PREFERENCE (matrimonial user — self only)
// ========================================
// req.user.userId JWT se aata hai. Agar preference exist nahi karti
// (user ne abhi tak form nahi bhara), null return karenge — error nahi,
// kyunki "not filled yet" ek normal state hai, exception nahi.

const getMyPreference = async (req, res) => {
  try {
    const preference = await PartnerPreference.findOne({
      userId: req.user.userId,
    });

    res.status(200).json({
      success: true,
      data: preference, // null agar abhi tak nahi bhari
    });

  } catch (error) {
    console.error(
      "Get my preference error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch your partner preference",
      error: error.message,
    });
  }
};


// ========================================
// SAVE MY PARTNER PREFERENCE (matrimonial user — self only, UPSERT)
// ========================================
// Agar userId ke liye preference already exist karti hai, update hogi.
// Nahi toh nayi create hogi. Isse ek user ki hamesha SIRF EK
// PartnerPreference document rahega — duplicate nahi banega.
// userId body se kabhi nahi liya jaata — hamesha req.user.userId se,
// taaki koi doosre user ke naam pe preference na bana sake.

const saveMyPreference = async (req, res) => {
  try {

    let updateData = { ...req.body };

    // Security: userId ko kabhi body se override nahi hone dena
    delete updateData.userId;

    const preference = await PartnerPreference.findOneAndUpdate(
      { userId: req.user.userId },
      { ...updateData, userId: req.user.userId },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    logActivity({
      action: "CREATED",
      module: "PARTNER_PREFERENCE",
      targetType: "PartnerPreference",
      targetId: preference._id,
      description: "Partner preference was saved by the user",
      user: preference.userId,
    });

    res.status(200).json({
      success: true,
      message: "Partner preference saved successfully",
      data: preference,
    });

  } catch (error) {
    console.error(
      "Save my preference error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to save your partner preference",
      error: error.message,
    });
  }
};


module.exports = {
  createPartnerPreference,
  getPartnerPreferences,
  updatePartnerPreference,
  deletePartnerPreference,
  getMyPreference,
  saveMyPreference,
};