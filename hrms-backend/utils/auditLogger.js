const AuditLog = require('../models/AuditLog');

const logActivity = async ({ userId, username, action, targetType, targetId, targetName, details, req }) => {
  try {
    let finalUserId = userId;
    let finalUsername = username;

    if (req && req.user) {
      finalUserId = finalUserId || req.user.id;
      if (!finalUsername) {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        if (user) {
          finalUsername = user.username;
        }
      }
    }

    const logEntry = new AuditLog({
      userId: finalUserId,
      username: finalUsername || 'System',
      action,
      targetType,
      targetId: targetId ? targetId.toString() : null,
      targetName,
      details,
    });

    await logEntry.save();
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }
};

module.exports = { logActivity };
