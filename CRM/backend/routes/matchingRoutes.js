const express = require("express");

const {
  getMatches,
} = require("../controllers/matchingController");

const router = express.Router();


// GET matching users
router.get("/:userId", getMatches);


module.exports = router;