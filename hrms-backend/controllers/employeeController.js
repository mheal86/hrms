const Employee = require('../models/Employee');
const DepartmentHistory = require('../models/DepartmentHistory');

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

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
      // Escape ký tự đặc biệt để tránh lỗi regex
      const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Tìm theo tên đầy đủ (firstName + ' ' + lastName) theo đúng thứ tự nhập
      // Đồng thời tìm cả chiều ngược (lastName + ' ' + firstName) và email
      filter.$or = [
        // Khớp "Tên Họ" hoặc "Họ Tên" theo thứ tự người dùng nhập
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: escaped,
              options: 'i',
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$lastName', ' ', '$firstName'] },
              regex: escaped,
              options: 'i',
            },
          },
        },
        // Tìm theo email
        { email: { $regex: escaped, $options: 'i' } },
        // Tìm từng từ trong firstName hoặc lastName (cho tìm kiếm từ đơn)
        { firstName: { $regex: escaped, $options: 'i' } },
        { lastName: { $regex: escaped, $options: 'i' } },
      ];
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

    // Lưu lịch sử phòng ban ban đầu
    if (saved.department) {
      await DepartmentHistory.create({
        employee: saved._id,
        fromDepartment: null,
        toDepartment: saved.department,
        transferDate: saved.hireDate || new Date()
      });
    }

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
    const updateData = { ...req.body };

    const existing = await Employee.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Tự động gán/xóa deactivatedDate khi thay đổi trạng thái
    if (updateData.status === 'INACTIVE') {
      if (existing.status !== 'INACTIVE') {
        updateData.deactivatedDate = new Date();
      }
    } else if (updateData.status === 'ACTIVE') {
      updateData.deactivatedDate = null;
    }

    const oldDept = existing.department;
    const newDept = updateData.department;

    const updated = await Employee.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('department', 'name');

    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Nếu đổi phòng ban, lưu vào lịch sử
    if (newDept && oldDept && oldDept.toString() !== newDept.toString()) {
      await DepartmentHistory.create({
        employee: req.params.id,
        fromDepartment: oldDept,
        toDepartment: newDept,
        transferDate: new Date()
      });
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
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    if (employee.status === 'ACTIVE') {
      return res.status(400).json({ message: 'Không thể xóa nhân viên đang hoạt động. Vui lòng chuyển trạng thái sang Ngừng hoạt động trước.' });
    }
    await Employee.findByIdAndDelete(req.params.id);
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

// GET /api/employees/:id/history
exports.getHistory = async (req, res) => {
  try {
    const history = await DepartmentHistory.find({ employee: req.params.id })
      .populate('fromDepartment', 'name')
      .populate('toDepartment', 'name')
      .sort({ transferDate: -1 });
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};