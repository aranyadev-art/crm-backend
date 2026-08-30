const User = require("../models/User");
const PartnerPreference = require("../models/PartnerPreference");


// ========================================
// CALCULATE AGE
// ========================================

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return null;
  }

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {
    age--;
  }

  return age;
};


// ========================================
// FIND MATCHING USERS
// ========================================

const getMatches = async (req, res) => {
  try {

    // ========================================
    // CURRENT USER
    // ========================================

    const currentUser = await User.findById(
      req.params.userId
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    // ========================================
    // PARTNER PREFERENCE
    // ========================================

    const preference =
      await PartnerPreference.findOne({
        userId: req.params.userId,
      });

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: "Partner preference not found",
      });
    }


    // ========================================
    // PREFERRED GENDER
    // ========================================

    const preferredGender =
      preference.preferredGender ||
      (
        currentUser.gender === "Male"
          ? "Female"
          : "Male"
      );


    // ========================================
    // GET CANDIDATE USERS
    // ========================================

    const users = await User.find({
      _id: {
        $ne: req.params.userId,
      },

      gender: preferredGender,
    });


    // ========================================
    // MATCHING
    // ========================================

    const matches = users.map((user) => {

      let score = 0;

      const matchedFields = [];


      // ========================================
      // AGE
      // ========================================

      const userAge =
        calculateAge(user.dateOfBirth);

      if (
        userAge !== null &&
        preference.minAge != null &&
        preference.maxAge != null
      ) {

        if (
          userAge >= preference.minAge &&
          userAge <= preference.maxAge
        ) {

          score += 40;

          matchedFields.push("Age");
        }
      }


      // ========================================
      // CITY
      // ========================================

      if (
        preference.preferredCity &&
        user.city
      ) {

        const preferredCity =
          preference.preferredCity
            .trim()
            .toLowerCase();

        const userCity =
          user.city
            .trim()
            .toLowerCase();

        if (preferredCity === userCity) {

          score += 35;

          matchedFields.push("City");
        }
      }


      // ========================================
      // STATE
      // ========================================

      if (
        preference.preferredState &&
        user.state
      ) {

        const preferredState =
          preference.preferredState
            .trim()
            .toLowerCase();

        const userState =
          user.state
            .trim()
            .toLowerCase();

        if (preferredState === userState) {

          score += 15;

          matchedFields.push("State");
        }
      }


      // ========================================
      // MARITAL STATUS
      // ========================================

      if (
        preference.maritalStatus &&
        user.maritalStatus
      ) {

        if (
          preference.maritalStatus
            .trim()
            .toLowerCase() ===
          user.maritalStatus
            .trim()
            .toLowerCase()
        ) {

          score += 5;

          matchedFields.push(
            "Marital Status"
          );
        }
      }


      // ========================================
      // EDUCATION
      // ========================================

      if (
        preference.education &&
        user.education
      ) {

        if (
          preference.education
            .trim()
            .toLowerCase() ===
          user.education
            .trim()
            .toLowerCase()
        ) {

          score += 5;

          matchedFields.push(
            "Education"
          );
        }
      }


      // ========================================
      // RETURN MATCH
      // ========================================

      return {
        ...user.toObject(),

        age: userAge,

        matchPercentage: score,

        matchedFields,
      };
    });


    // ========================================
    // MINIMUM MATCH
    // ========================================

    const filteredMatches =
      matches.filter(
        (user) =>
          user.matchPercentage >= 40
      );


    // ========================================
    // BEST MATCH FIRST
    // ========================================

    filteredMatches.sort(
      (a, b) =>
        b.matchPercentage -
        a.matchPercentage
    );


    // ========================================
    // RESPONSE
    // ========================================

    res.status(200).json({
      success: true,

      count:
        filteredMatches.length,

      data:
        filteredMatches,
    });

  } catch (error) {

    console.error(
      "Matching error:",
      error.message
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to find matches",

      error:
        error.message,
    });
  }
};


// ========================================
// EXPORT
// ========================================

module.exports = {
  getMatches,
};