const bcrypt = require("bcryptjs");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const { sendWelcomeEmail, sendCredentialsEmail } = require("../services/emailService");
const { generateWhatsAppLink } = require("../services/whatsappService");
const { logActivity } = require("../services/activityService");
const { generateUniqueUsername, generatePassword } = require("../utils/credentialGenerator");


// ========================================
// UPLOAD IMAGE TO CLOUDINARY
// ========================================

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "crm_users",
        resource_type: "image",
      },
      (error, result) => {

        if (error) {
          reject(error);
        } else {
          resolve(result);
        }

      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};


// ========================================
// CREATE USER
// ========================================

const createUser = async (req, res) => {
  try {

    let profilePhoto = "";

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);
      profilePhoto = uploadedImage.secure_url;
    }

    const username = await generateUniqueUsername(User);
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const userData = {
      ...req.body,
      profilePhoto,
      username,
      password: hashedPassword,
    };

    const user = await User.create(userData);

    logActivity({
      action: "CREATED",
      module: "USER",
      targetType: "User",
      targetId: user._id,
      description: `New user ${user.fullName} was created`,
    });

    let whatsappLink = null;

    try {
      whatsappLink = generateWhatsAppLink(user);
    } catch (error) {
      console.error("WhatsApp link generation failed:", error.message);
    }

    user.password = undefined;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
      whatsappLink,
    });

    if (user.emailId) {
      sendWelcomeEmail(user).catch((error) => {
        console.error("Welcome email failed:", error.message);
      });

      sendCredentialsEmail(user, plainPassword).catch((error) => {
        console.error("Credentials email failed:", error.message);
      });
    }

  } catch (error) {

    console.error("Create user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};


// ========================================
// PRESENCE TIMEOUT (2 minutes)
// ========================================
// lastSeen isse purana ho toh user ko "offline" treat karo,
// chahe DB mein onlineStatus "online" hi likha ho (crash/close
// jaise cases handle karne ke liye).

const OFFLINE_TIMEOUT_MS = 2 * 60 * 1000;

const getDerivedOnlineStatus = (user) => {

  if (user.onlineStatus !== "online") {
    return "offline";
  }

  if (!user.lastSeen) {
    return "offline";
  }

  const isStale = Date.now() - new Date(user.lastSeen).getTime() > OFFLINE_TIMEOUT_MS;

  return isStale ? "offline" : "online";
};


// ========================================
// GET ALL USERS
// ========================================

const getUsers = async (req, res) => {
  try {

    const users = await User.find().sort({
      createdAt: -1,
    });

    const usersWithPresence = users.map((user) => {

      const userObject = user.toObject();

      userObject.onlineStatus = getDerivedOnlineStatus(user);

      return userObject;

    });

    res.status(200).json({
      success: true,
      count: usersWithPresence.length,
      data: usersWithPresence,
    });

  } catch (error) {

    console.error("Get users error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};


// ========================================
// DELETE USER
// ========================================

const deleteUser = async (req, res) => {
  try {

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {

    console.error("Delete user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};


// ========================================
// UPDATE USER
// ========================================

const updateUser = async (req, res) => {
  try {

    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let updateData = {
      ...req.body,
    };

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);
      updateData.profilePhoto = uploadedImage.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });

  } catch (error) {

    console.error("Update user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};


// ========================================
// GET MY PROFILE (matrimonial user — self only)
// ========================================
// req.user.userId JWT se aata hai (authMiddleware.protect ke through).
// URL mein koi :id nahi — isliye koi bhi user sirf apna record hi
// fetch kar sakta hai, doosre ka nahi.

const getMe = async (req, res) => {
  try {

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {

    console.error("Get me error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};


// ========================================
// UPDATE MY PROFILE (matrimonial user — self only)
// ========================================
// Same principle: req.user.userId se target decide hota hai,
// req.body ya req.params se nahi. Username/password/role yahan
// se kabhi change nahi honge — security ke liye explicitly hataye.

const updateMe = async (req, res) => {
  try {

    let updateData = { ...req.body };

    // Sensitive fields ko yahan se kabhi allow nahi karna
    delete updateData.username;
    delete updateData.password;
    delete updateData.role;

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);
      updateData.profilePhoto = uploadedImage.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });

  } catch (error) {

    console.error("Update me error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
}; 
 

// Purane documents mein ye fields missing ho sakte hain
// (schema update se pehle create hue the) — fallback defaults.

const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: true,
  whatsapp: true,
  matches: true,
  messages: true,
  meetings: true,
};

const DEFAULT_PRIVACY_SETTINGS = {
  profileVisibility: "visible",
  showContact: false,
  showEmail: false,
  allowMessages: true,
};

const getMySettings = async (req, res) => {
  try {

    const user = await User.findById(req.user.userId).select(
      "notificationPreferences privacySettings username emailId"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Settings not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        notificationPreferences:
          user.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES,
        privacySettings:
          user.privacySettings || DEFAULT_PRIVACY_SETTINGS,
        username: user.username,
        emailId: user.emailId,
      },
    });

  } catch (error) {

    console.error("Get settings error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE MY SETTINGS
// ========================================
// Sirf notificationPreferences aur privacySettings hi update
// hote hain yahan se — username/email/password kabhi nahi.

const updateMySettings = async (req, res) => {
  try {

    const { notificationPreferences, privacySettings } = req.body;

    const updateData = {};

    if (notificationPreferences) {
      updateData.notificationPreferences = notificationPreferences;
    }

    if (privacySettings) {
      updateData.privacySettings = privacySettings;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("notificationPreferences privacySettings");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Settings not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: {
        notificationPreferences: user.notificationPreferences,
        privacySettings: user.privacySettings,
      },
    });

  } catch (error) {

    console.error("Update settings error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};


// ========================================
// CHANGE MY PASSWORD
// ========================================
// Authenticated flow — current password verify karke
// naya password set karta hai. req.user.userId se target
// decide hota hai, koi :id nahi.

const changeMyPassword = async (req, res) => {
  try {

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.userId).select("+password");

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {

    console.error("Change password error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

// ========================================
// HEARTBEAT (update lastSeen for logged-in user)
// ========================================
// req.user JWT se aata hai (protect middleware) — body se
// koi userId nahi liya jata, isliye user sirf apna hi
// presence update kar sakta hai.
const heartbeat = async (req, res) => {
  try {

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      {
        onlineStatus: "online",
        lastSeen: new Date(),
      },
      { new: true }
    );


    res.status(200).json({
      success: true,
      message: "Heartbeat updated",
    });

  } catch (error) {

    console.error("Heartbeat error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update heartbeat",
      error: error.message,
    });
  }
};


module.exports = {
  createUser,
  getUsers,
  deleteUser,
  updateUser,
  getMe,
  updateMe,
  heartbeat,
  getMySettings,
  updateMySettings,
  changeMyPassword,
};