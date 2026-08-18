const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const Employee = require('../models/Employee');
const { logActivity } = require('../utils/auditLogger');



// POST /api/users
exports.create = async (req, res) => {
  try {
    const { username, password, roleName, employeeId } = req.body;

    if (!username || !password || !roleName) {
      return res.status(400).json({ message: 'username, password, roleName are required' });
    }

    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ message: `Role "${roleName}" not found` });
    }

    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(400).json({ message: 'Employee not found' });
      }

      const existingUser = await User.findOne({ employee: employeeId });
      if (existingUser) {
        return res.status(400).json({ message: 'This employee already has a user account' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: role._id,
      employee: employeeId || null,
    });

    const populatedUser = await User.findById(user._id)
      .populate('role', 'name')
      .populate('employee', 'firstName lastName email')
      .select('-password');

    res.status(201).json(populatedUser);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(400).json({ message: err.message });
  }
};

// GET /api/users/check-username?username=xyz
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: 'Username query parameter is required' });
    }
    const user = await User.findOne({ username: username.trim() });
    if (user) {
      return res.status(200).json({ exists: true, message: 'Username already exists' });
    }
    res.status(200).json({ exists: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET /api/users
exports.getAll = async (req, res) => {
  try {
    const users = await User.find()
      .populate('role', 'name')
      .populate('employee', 'firstName lastName email')
      .select('-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/by-employee/:employeeId
exports.getByEmployeeId = async (req, res) => {
  try {
    const user = await User.findOne({ employee: req.params.employeeId })
      .populate('role', 'name')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Employee này chưa có tài khoản' });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id
exports.update = async (req, res) => {
  try {
    const { username, roleName, newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) {
      user.username = username;
    }

    if (roleName) {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        return res.status(400).json({ message: `Role "${roleName}" not found` });
      }
      user.role = role._id;
    }

    const isPasswordChanged = !!newPassword;

    if (newPassword) {
      user.password = await bcrypt.hash(newPassword, 10);
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();

    // Ghi log hoạt động
    await logActivity({
      req,
      action: isPasswordChanged ? 'CHANGE_PASSWORD_BY_ADMIN' : 'UPDATE_USER',
      targetType: 'USER',
      targetId: user._id,
      targetName: user.username,
      details: isPasswordChanged 
        ? { message: `Admin reset password for user ${user.username}` }
        : { username: user.username, role: roleName },
    });

    const updatedUser = await User.findById(user._id).populate('role', 'name').select('-password');
    res.status(200).json(updatedUser);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(400).json({ message: err.message });
  }
};