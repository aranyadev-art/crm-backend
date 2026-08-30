const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { sendPasswordResetCode } = require("../services/emailService");


// ========================================
// LOGIN
// ========================================
// Flow:
// 1. username + password body se lo
// 2. Pehle Admin collection mein dhoondo, phir User collection mein
//    (jahan bhi mile, wahi use karo — dono jagah ek saath match
//    nahi hoga kyunki username unique hai apne-apne collection mein)
// 3. bcrypt.compare se password match karo
// 4. Match ho toh JWT generate karo, safe user info ke saath response bhejo
// 5. Agar login karne wala matrimonial User hai, uska online
//    presence bhi update karo
// 6. Kabhi bhi specific error mat do — generic "Invalid credentials" hi bhejo

const login = async (req, res) => {
  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const normalizedUsername = username.toLowerCase().trim();

    let account = await Admin.findOne({
      username: normalizedUsername,
    }).select("+password");

    let isMatrimonialUser = false;

    if (!account) {
      account = await User.findOne({
        username: normalizedUsername,
      }).select("+password");

      isMatrimonialUser = true;
    }

    if (!account || !account.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, account.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (isMatrimonialUser) {

      const now = new Date();

      account.onlineStatus = "online";
      account.lastLogin = now;
      account.lastSeen = now;

      await account.save({ validateBeforeSave: false });

    }

    const token = generateToken({
      userId: account._id,
      username: account.username,
      role: account.role,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: account._id,
        username: account.username,
        fullName: account.fullName,
        role: account.role,
      },
    });

  } catch (error) {

    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};


// ========================================
// LOGOUT
// ========================================

const logout = async (req, res) => {
  try {

    if (req.user.role === "user") {

      await User.findByIdAndUpdate(req.user.userId, {
        onlineStatus: "offline",
        lastSeen: new Date(),
      });

    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {

    console.error("Logout error:", error.message);

    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};


// ========================================
// HELPER: MASK EMAIL
// ========================================
// "aranya@gmail.com" -> "a***a@gmail.com"

const maskEmail = (email) => {
  const [localPart, domain] = email.split("@");

  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }

  const first = localPart[0];
  const last = localPart[localPart.length - 1];

  return `${first}***${last}@${domain}`;
};


// ========================================
// FORGOT PASSWORD (request OTP)
// ========================================
// Sirf matrimonial Users ke liye — Admin ke paas email field
// nahi hai, isliye unke liye ye flow support nahi hota.

const forgotPassword = async (req, res) => {
  try {

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const normalizedUsername = username.toLowerCase().trim();

    const isAdminAccount = await Admin.findOne({
      username: normalizedUsername,
    });

    if (isAdminAccount) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset via email is not available for admin accounts. Please contact your system administrator.",
      });
    }

    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this username",
      });
    }

    if (!user.emailId) {
      return res.status(400).json({
        success: false,
        message: "No email is associated with this account. Please contact support.",
      });
    }

    // 6-digit numeric OTP
    const plainCode = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedCode = await bcrypt.hash(plainCode, 10);

    user.passwordResetCode = hashedCode;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetCode(user, plainCode);
    } catch (emailError) {
      console.error("Password reset email failed:", emailError.message);

      return res.status(500).json({
        success: false,
        message: "Failed to send reset code. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: `A reset code has been sent to ${maskEmail(user.emailId)}`,
    });

  } catch (error) {

    console.error("Forgot password error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: error.message,
    });
  }
};


// ========================================
// RESET PASSWORD (verify OTP + set new password)
// ========================================

const resetPassword = async (req, res) => {
  try {

    const { username, code, newPassword } = req.body;

    if (!username || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Username, code, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const normalizedUsername = username.toLowerCase().trim();

    const user = await User.findOne({ username: normalizedUsername }).select(
      "+passwordResetCode +passwordResetExpires"
    );

    if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code. Please request a new one.",
      });
    }

    if (user.passwordResetExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "This reset code has expired. Please request a new one.",
      });
    }

    const isCodeCorrect = await bcrypt.compare(code, user.passwordResetCode);

    if (!isCodeCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset code",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetCode = null;
    user.passwordResetExpires = null;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });

  } catch (error) {

    console.error("Reset password error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};


module.exports = {
  login,
  logout,
  forgotPassword,
  resetPassword,
};