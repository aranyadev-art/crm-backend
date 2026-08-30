const jwt = require("jsonwebtoken");

// ========================================
// GENERATE JWT TOKEN
// ========================================
// Payload mein sirf zaroori, non-sensitive info hoti hai —
// password, email, contact number kabhi is mein nahi jaate.

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};


// ========================================
// VERIFY JWT TOKEN
// ========================================
// Invalid/expired token hone par jwt.verify khud error throw
// karega — isko middleware apne try/catch mein handle karega.

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};


module.exports = {
  generateToken,
  verifyToken,
};