const Employee = require('../models/Employee');

// GET /api/employees?page=1&limit=10&sort=hireDate&order=desc&search=nguyen
exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortField = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const search = (req.query.search || '').trim();
    const departmentFilter = req.query.department || '';
    const statusFilter = req.query.status || '';

    const filter = {};

    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean);
      filter.$and = tokens.map((token) => ({
        $or: [
          { firstName: { $regex: token, $options: 'i' } },
          { lastName: { $regex: token, $options: 'i' } },
          { email: { $regex: token, $options: 'i' } },
        ],
      }));
    }

    if (departmentFilter) {
      filter.department = departmentFilter;
    }

    if (statusFilter) {
      filter.status = statusFilter;
    }

    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('department', 'name')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({
      data: employees,
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

// GET /api/employees/:id
exports.getById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('department', 'name');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/employees
exports.create = async (req, res) => {
  try {
    const employee = new Employee(req.body);
    const saved = await employee.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/employees/:id
exports.update = async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('department', 'name');
    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/employees/:id
exports.remove = async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/employees/:id/avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { avatarUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};