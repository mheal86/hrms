const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortField = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const { search, userId, action, startDate, endDate, targetId } = req.query;

    const filter = {};

    const mapSearchToAction = (searchTerm) => {
      const normalized = searchTerm.toLowerCase().trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const mappings = [
        { keys: ['them nhan vien', 'create employee', 'them nv'], action: 'CREATE_EMPLOYEE' },
        { keys: ['sua nhan vien', 'cap nhat nhan vien', 'update employee', 'sua nv', 'cap nhat nv'], action: 'UPDATE_EMPLOYEE' },
        { keys: ['xoa nhan vien', 'delete employee', 'xoa nv'], action: 'DELETE_EMPLOYEE' },
        { keys: ['them phong ban', 'create department', 'create dept', 'them pb'], action: 'CREATE_DEPARTMENT' },
        { keys: ['sua phong ban', 'cap nhat phong ban', 'update department', 'update dept', 'sua pb', 'cap nhat pb'], action: 'UPDATE_DEPARTMENT' },
        { keys: ['xoa phong ban', 'delete department', 'delete dept', 'xoa pb'], action: 'DELETE_DEPARTMENT' },
        { keys: ['chuyen phong ban', 'transfer employee', 'chuyen pb', 'chuyen nv'], action: 'TRANSFER_EMPLOYEE' },
        { keys: ['doi mat khau', 'change password', 'reset password'], action: ['CHANGE_PASSWORD', 'CHANGE_PASSWORD_BY_ADMIN'] },
        { keys: ['cap nhat tai khoan', 'update account', 'update user'], action: 'UPDATE_USER' }
      ];

      const matchedActions = [];
      for (const item of mappings) {
        if (item.keys.some(k => normalized.includes(k) || k.includes(normalized))) {
          if (Array.isArray(item.action)) {
            matchedActions.push(...item.action);
          } else {
            matchedActions.push(item.action);
          }
        }
      }
      return matchedActions;
    };

    if (search) {
      const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const conditions = [
        { username: { $regex: escaped, $options: 'i' } },
        { targetName: { $regex: escaped, $options: 'i' } },
        { action: { $regex: escaped, $options: 'i' } },
      ];

      const matchedActions = mapSearchToAction(search);
      if (matchedActions.length > 0) {
        conditions.push({ action: { $in: matchedActions } });
      }

      filter.$or = conditions;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (action) {
      filter.action = action;
    }

    if (targetId) {
      filter.targetId = targetId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        filter.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'username')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActions = async (req, res) => {
  try {
    const actions = await AuditLog.distinct('action');
    res.status(200).json(actions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username').sort({ username: 1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
