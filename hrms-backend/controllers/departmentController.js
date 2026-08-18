const Department = require('../models/Department');
const Employee = require('../models/Employee');
const { logActivity } = require('../utils/auditLogger');

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// GET /api/departments
exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || '').trim();

    const filter = {};

    const mapSearchToDepartmentName = (searchTerm) => {
      const normalized = searchTerm.toLowerCase().trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const mappings = [
        { keys: ['hr', 'human resources', 'nhan su'], val: 'Nhân sự' },
        { keys: ['tech', 'it', 'information technology', 'cong nghe thong tin', 'cntt'], val: 'Công nghệ thông tin' },
        { keys: ['finance', 'accounting', 'ke toan'], val: 'Kế toán' },
        { keys: ['marketing'], val: 'Marketing' },
        { keys: ['sales', 'kinh doanh'], val: 'Kinh doanh' },
        { keys: ['admin', 'administration', 'hanh chinh'], val: 'Hành chính' },
        { keys: ['r&d', 'research', 'development', 'nghien cuu'], val: 'Nghiên cứu & Phát triển' },
        { keys: ['project', 'quan ly du an'], val: 'Quản lý dự án' },
        { keys: ['customer service', 'support', 'cham soc khach hang'], val: 'Chăm sóc khách hàng' },
        { keys: ['legal', 'phap che'], val: 'Pháp chế' },
        { keys: ['design', 'thiet ke'], val: 'Thiết kế' },
        { keys: ['training', 'dao tao'], val: 'Đào tạo' }
      ];

      const matchedNames = [];
      for (const item of mappings) {
        if (item.keys.some(k => normalized.includes(k) || k.includes(normalized))) {
          matchedNames.push(item.val);
        }
      }
      return matchedNames;
    };

    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean);
      filter.$and = tokens.map((token) => {
        const escapedToken = escapeRegex(token);
        const conditions = [
          { name: { $regex: escapedToken, $options: 'i' } },
          { description: { $regex: escapedToken, $options: 'i' } },
        ];

        const matchedNames = mapSearchToDepartmentName(token);
        if (matchedNames.length > 0) {
          matchedNames.forEach(name => {
            conditions.push({ name: { $regex: escapeRegex(name), $options: 'i' } });
          });
        }

        return { $or: conditions };
      });
    }

    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      Department.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Department.countDocuments(filter),
    ]);

    res.status(200).json({
      data: departments,
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

// GET /api/departments/:id
exports.getById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(200).json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/departments
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
      return res.status(400).json({ message: 'Tên phòng ban là bắt buộc' });
    }

    // Chỉ cho phép chữ, số, khoảng trắng, dấu chấm, dấu ngoặc, dấu gạch ngang
    const nameRegex = /^[\p{L}0-9\s().-]+$/u;
    if (!nameRegex.test(trimmedName)) {
      return res.status(400).json({ message: 'Tên phòng ban không được chứa ký tự đặc biệt' });
    }

    const escapedName = escapeRegex(trimmedName);
    const existing = await Department.findOne({ name: { $regex: `^${escapedName}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ message: 'Tên phòng ban này đã tồn tại' });
    }

    const department = new Department({ name: trimmedName, description });
    const saved = await department.save();

    // Ghi log hoạt động
    await logActivity({
      req,
      action: 'CREATE_DEPARTMENT',
      targetType: 'DEPARTMENT',
      targetId: saved._id,
      targetName: saved.name,
      details: saved,
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/departments/:id
exports.update = async (req, res) => {
  try {
    const { name, description } = req.body;
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
      return res.status(400).json({ message: 'Tên phòng ban là bắt buộc' });
    }

    // Chỉ cho phép chữ, số, khoảng trắng, dấu chấm, dấu ngoặc, dấu gạch ngang
    const nameRegex = /^[\p{L}0-9\s().-]+$/u;
    if (!nameRegex.test(trimmedName)) {
      return res.status(400).json({ message: 'Tên phòng ban không được chứa ký tự đặc biệt' });
    }

    const escapedName = escapeRegex(trimmedName);
    const existing = await Department.findOne({ 
      name: { $regex: `^${escapedName}$`, $options: 'i' },
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({ message: 'Tên phòng ban này đã tồn tại' });
    }

    const oldDept = await Department.findById(req.params.id);
    if (!oldDept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const updated = await Department.findByIdAndUpdate(req.params.id, { name: trimmedName, description }, {
      new: true,
      runValidators: true,
    });

    // Ghi log hoạt động
    await logActivity({
      req,
      action: 'UPDATE_DEPARTMENT',
      targetType: 'DEPARTMENT',
      targetId: updated._id,
      targetName: updated.name,
      details: { before: oldDept, after: updated },
    });

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/departments/:id
exports.remove = async (req, res) => {
  try {
    const departmentId = req.params.id;

    // Kiểm tra xem phòng ban còn nhân viên không
    const employeeCount = await Employee.countDocuments({ department: departmentId });
    if (employeeCount > 0) {
      return res.status(400).json({
        message: `Phòng ban này còn ${employeeCount} nhân viên. Vui lòng sắp xếp lại nhân viên trước khi xóa.`,
        employeeCount,
      });
    }

    const deleted = await Department.findByIdAndDelete(departmentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Ghi log hoạt động
    await logActivity({
      req,
      action: 'DELETE_DEPARTMENT',
      targetType: 'DEPARTMENT',
      targetId: deleted._id,
      targetName: deleted.name,
      details: deleted,
    });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};