const { verifyToken } = require("../utils/jwt");


// ========================================
// PROTECT ROUTE (JWT VERIFICATION)
// ========================================
// Flow:
// 1. Authorization header se token nikalo
// 2. Token missing ho toh 401
// 3. Token verify karo — invalid/expired ho toh 401
// 4. Verified payload ko req.user mein attach karo, next() call karo

const protect = (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    req.user = decoded; // { userId, username, role, iat, exp }

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid or expired token",
    });
  }
};


// ========================================
// RESTRICT TO SPECIFIC ROLES
// ========================================
// Usage: router.get("/reports", protect, restrictTo("admin", "staff"), getReports)
// protect middleware ke BAAD hi use hoga, kyunki req.user isi se aata hai.

const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};


module.exports = {
  protect,
  restrictTo,
};