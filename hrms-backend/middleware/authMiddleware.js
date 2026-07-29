const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Kiểm tra đã login chưa (có JWT hợp lệ không)
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kiểm tra tokenVersion động trong Database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Nếu token không chứa tokenVersion hoặc tokenVersion không trùng khớp với DB
    if (decoded.tokenVersion === undefined || user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: 'Token has been invalidated (password changed)' });
    }

    req.user = decoded; // gắn thông tin user (id, role, tokenVersion) vào request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Kiểm tra role có phải Admin không
exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};