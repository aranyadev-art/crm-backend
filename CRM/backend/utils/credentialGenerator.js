const crypto = require("crypto");

// ========================================
// GENERATE RANDOM USERNAME
// ========================================
// Format: matri_ + 5 random lowercase alphanumeric characters
// Example: matri_7k29x

const generateUsername = () => {
  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .slice(0, 5);

  return `matri_${randomPart}`;
};


// ========================================
// GENERATE UNIQUE USERNAME (DB-checked)
// ========================================
// User model ko pass karte hain taaki collision check
// yahin ho jaye, controller mein dobara logic likhna na pade.

const generateUniqueUsername = async (UserModel) => {
  let username;
  let exists = true;

  while (exists) {
    username = generateUsername();

    const existingUser = await UserModel.findOne({ username });

    exists = !!existingUser;
  }

  return username;
};


// ========================================
// GENERATE SECURE RANDOM PASSWORD
// ========================================
// Guarantees at least one uppercase, one lowercase,
// one number, and one special character.
// Example: M@7xK92pL

const generatePassword = (length = 10) => {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const specialChars = "@#$%&*!";

  const allChars = uppercase + lowercase + numbers + specialChars;

  const getRandomChar = (charSet) => {
    const randomIndex = crypto.randomInt(0, charSet.length);
    return charSet[randomIndex];
  };

  // Ensure at least one character from each required set
  let passwordChars = [
    getRandomChar(uppercase),
    getRandomChar(lowercase),
    getRandomChar(numbers),
    getRandomChar(specialChars),
  ];

  // Fill remaining length with random characters from full pool
  for (let i = passwordChars.length; i < length; i++) {
    passwordChars.push(getRandomChar(allChars));
  }

  // Shuffle so required chars aren't always at the start
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
};


module.exports = {
  generateUniqueUsername,
  generatePassword,
};