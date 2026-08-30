const Activity = require("../models/Activity");

// =========================
// LOG ACTIVITY (never throws, never blocks main operation)
// =========================

const logActivity = async ({
  action,
  module,
  targetType,
  targetId,
  description,
  user = null,
  performedBy = null,
  metadata = {},
}) => {
  try {
    await Activity.create({
      action,
      module,
      targetType,
      targetId,
      description,
      user,
      performedBy,
      metadata,
    });
  } catch (error) {
    console.error(
      `Activity logging failed [${module}/${action}]:`,
      error.message
    );
    // Intentionally swallow the error — activity logging must
    // never break the main business operation.
  }
};

module.exports = {
  logActivity,
};