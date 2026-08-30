const express = require("express");


const {
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
} = require("../controllers/userController");

const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// MY PROFILE (matrimonial user — self only)
// ========================================
// IMPORTANT: Ye /:id routes se PEHLE hone chahiye,
// warna Express "me" ko :id ki tarah treat kar lega.

router.get("/me", protect, getMe);
router.put("/me", protect, upload.single("profilePhoto"), updateMe);
router.patch("/me/heartbeat", protect, heartbeat);
router.get("/me/settings", protect, getMySettings);
router.patch("/me/settings", protect, updateMySettings);
router.patch("/me/change-password", protect, changeMyPassword);


// GET all users
router.get("/", getUsers);


// CREATE user
router.post("/",   upload.single("profilePhoto"),createUser);
router.delete("/:id", deleteUser);
router.put("/:id",  upload.single("profilePhoto"), updateUser);

module.exports = router;