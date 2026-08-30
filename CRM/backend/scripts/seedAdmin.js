require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");
const { generateUniqueUsername, generatePassword } = require("../utils/credentialGenerator");


// ========================================
// SEED ADMIN
// ========================================
// Ye script sirf manually terminal se chalani hai:
//   node scripts/seedAdmin.js
// Existing admin API ka hissa NAHI hai — one-time setup ke liye hai.

const seedAdmin = async () => {
  try {

    await connectDB();

    const existingAdminCount = await Admin.countDocuments();

    if (existingAdminCount > 0) {
      console.log("⚠️  Admin already exists. Seed script skipped.");
      console.log(`   Total admins in DB: ${existingAdminCount}`);
      process.exit(0);
    }

    const username = await generateUniqueUsername(Admin);
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const admin = await Admin.create({
      fullName: "System Admin",
      username,
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin created successfully!");
    console.log("----------------------------------------");
    console.log(`Username : ${admin.username}`);
    console.log(`Password : ${plainPassword}`);
    console.log("----------------------------------------");
    console.log("⚠️  Save this password now — it will not be shown again.");

    process.exit(0);

  } catch (error) {

    console.error("❌ Seeding failed:", error.message);
    process.exit(1);

  }
};

seedAdmin();