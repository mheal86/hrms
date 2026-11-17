const Employee = require('../models/Employee');
const DepartmentHistory = require('../models/DepartmentHistory');
const User = require('../models/User');
const { logActivity } = require('../utils/auditLogger');

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// User thường chỉ thấy thông tin liên hệ cơ bản; SĐT, địa chỉ, ngày sinh chỉ hiện với Admin hoặc chính chủ.
const PRIVATE_FIELDS = ['phone', 'address', 'dateOfBirth'];
const maskEmployee = (doc, ownEmployeeId, isAdmin) => {
  if (isAdmin || (ownEmployeeId && String(doc._id) === String(ownEmployeeId))) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  PRIVATE_FIELDS.forEach((f) => delete obj[f]);
  return obj;
};
const getOwnEmployeeId = async (req) => {
  const user = await User.findById(req.user.id).select('employee');
  return user?.employee || null;
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

    const isAdmin = req.user.role === 'ADMIN';
    const ownId = isAdmin ? null : await getOwnEmployeeId(req);

    res.status(200).json({
      data: employees.map((e) => maskEmployee(e, ownId, isAdmin)),
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
    const isAdmin = req.user.role === 'ADMIN';
    const ownId = isAdmin ? null : await getOwnEmployeeId(req);
    res.status(200).json(maskEmployee(employee, ownId, isAdmin));
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

    // Ghi log hoạt động
    await logActivity({
      req,
      action: 'CREATE_EMPLOYEE',
      targetType: 'EMPLOYEE',
      targetId: saved._id,
      targetName: `${saved.firstName} ${saved.lastName}`,
      details: saved,
    });

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

    const getDeptIdStr = (dept) => {
      if (!dept) return null;
      if (typeof dept === 'object') {
        return dept._id ? dept._id.toString() : dept.toString();
      }
      return dept.toString();
    };

    const oldDeptIdStr = getDeptIdStr(existing.department);
    const newDeptIdStr = getDeptIdStr(updateData.department);

    const updated = await Employee.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('department', 'name');

    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Nếu đổi phòng ban, lưu vào lịch sử và log TRANSFER_EMPLOYEE
    if (newDeptIdStr && oldDeptIdStr && oldDeptIdStr !== newDeptIdStr) {
      await DepartmentHistory.create({
        employee: req.params.id,
        fromDepartment: oldDeptIdStr,
        toDepartment: newDeptIdStr,
        transferDate: new Date()
      });

      const Department = require('../models/Department');
      const [fromDeptObj, toDeptObj] = await Promise.all([
        Department.findById(oldDeptIdStr),
        Department.findById(newDeptIdStr)
      ]);

      await logActivity({
        req,
        action: 'TRANSFER_EMPLOYEE',
        targetType: 'EMPLOYEE',
        targetId: updated._id,
        targetName: `${updated.firstName} ${updated.lastName}`,
        details: {
          fromDepartmentId: oldDeptIdStr,
          fromDepartmentName: fromDeptObj ? fromDeptObj.name : 'Unknown',
          toDepartmentId: newDeptIdStr,
          toDepartmentName: toDeptObj ? toDeptObj.name : 'Unknown',
        }
      });
    }

    // Log UPDATE_EMPLOYEE
    await logActivity({
      req,
      action: 'UPDATE_EMPLOYEE',
      targetType: 'EMPLOYEE',
      targetId: updated._id,
      targetName: `${updated.firstName} ${updated.lastName}`,
      details: { before: existing, after: updated },
    });

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

    // Ghi log hoạt động
    await logActivity({
      req,
      action: 'DELETE_EMPLOYEE',
      targetType: 'EMPLOYEE',
      targetId: employee._id,
      targetName: `${employee.firstName} ${employee.lastName}`,
      details: employee,
    });

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
    if (req.user.role !== 'ADMIN') {
      const ownId = await getOwnEmployeeId(req);
      if (!ownId || String(ownId) !== String(req.params.id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    const history = await DepartmentHistory.find({ employee: req.params.id })
      .populate('fromDepartment', 'name')
      .populate('toDepartment', 'name')
      .sort({ transferDate: -1 });
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── HELPER FUNCTIONS CHO IMPORT EXCEL ────────────────────────────────
const validatePhone = (value) => {
  if (!value) return true;
  return /^0\d{9}$/.test(value);
};

const validateAddress = (value) => {
  if (!value) return true;
  const letterCount = (value.match(/[a-zA-ZÀ-ỹ]/g) || []).length;
  return letterCount >= 3;
};

const validateGmail = (value) => {
  if (!value) return true;
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value)) return false;
  const parts = value.split('@');
  const localPart = parts[0];
  return localPart.length >= 3 && /[a-zA-Z]/.test(localPart);
};

const matchDepartment = (deptStr, departments) => {
  if (!deptStr) return null;
  const normalizedInput = String(deptStr).trim().toLowerCase()
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

  let matchedVal = null;
  for (const item of mappings) {
    if (item.keys.some(k => normalizedInput.includes(k) || k.includes(normalizedInput))) {
      matchedVal = item.val;
      break;
    }
  }

  for (const dept of departments) {
    const dbName = dept.name;
    const normalizedDbName = dbName.toLowerCase().trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalizedDbName === normalizedInput) {
      return dept;
    }
    if (matchedVal) {
      const normalizedMapped = matchedVal.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalizedDbName.includes(normalizedMapped) || normalizedMapped.includes(normalizedDbName)) {
        return dept;
      }
    }
    if (normalizedDbName.includes(normalizedInput) || normalizedInput.includes(normalizedDbName)) {
      return dept;
    }
  }

  return null;
};

const matchGender = (genderStr) => {
  if (!genderStr) return null;
  const g = String(genderStr).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (['nam', 'male', 'm'].includes(g)) return 'MALE';
  if (['nữ', 'nu', 'female', 'f'].includes(g)) return 'FEMALE';
  if (['khác', 'khac', 'other', 'o'].includes(g)) return 'OTHER';
  return null;
};

const matchStatus = (statusStr) => {
  if (!statusStr) return 'ACTIVE';
  const s = String(statusStr).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (['hoạt động', 'hoat dong', 'đang hoạt động', 'dang hoat dong', 'active', 'a'].includes(s)) return 'ACTIVE';
  if (['ngừng hoạt động', 'ngung hoat dong', 'không hoạt động', 'khong hoat dong', 'inactive', 'i'].includes(s)) return 'INACTIVE';
  return 'ACTIVE';
};

const matchPosition = (positionStr) => {
  if (!positionStr) return null;
  const p = String(positionStr).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  const positionMap = {
    'nhân viên': 'Nhân viên',
    'staff': 'Nhân viên',
    'employee': 'Nhân viên',
    'trưởng nhóm': 'Trưởng nhóm',
    'team leader': 'Trưởng nhóm',
    'leader': 'Trưởng nhóm',
    'trưởng phòng': 'Trưởng phòng',
    'department head': 'Trưởng phòng',
    'dept head': 'Trưởng phòng',
    'phó phòng': 'Phó phòng',
    'deputy head': 'Phó phòng',
    'dept deputy': 'Phó phòng',
    'phó giám đốc': 'Phó giám đốc',
    'deputy general director': 'Phó giám đốc',
    'deputy gd': 'Phó giám đốc',
    'giám đốc': 'Giám đốc',
    'general director': 'Giám đốc',
    'gd': 'Giám đốc',
    'thực tập sinh': 'Thực tập sinh',
    'intern': 'Thực tập sinh'
  };

  for (const [key, value] of Object.entries(positionMap)) {
    const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (p === normKey || p.includes(normKey)) {
      return value;
    }
  }
  return null;
};

// POST /api/employees/import
exports.importEmployees = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const xlsx = require('xlsx');
  const mongoose = require('mongoose');
  const Department = require('../models/Department');
  const DepartmentHistory = require('../models/DepartmentHistory');

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (rawRows.length === 0) {
      return res.status(400).json({ success: false, message: 'The Excel file is empty' });
    }

    const headers = Object.keys(rawRows[0]).map(h => h.trim());
    const hasFullName = headers.some(h => h.toLowerCase() === 'full name');
    const hasEmail = headers.some(h => h.toLowerCase() === 'email');
    if (!hasFullName || !hasEmail) {
      return res.status(400).json({
        success: false,
        message: 'File is missing required columns. Ensure "Full Name" and "Email" exist.'
      });
    }

    const departments = await Department.find({});
    const errors = [];
    const validatedEmployees = [];
    const emailInFile = new Set();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowIndex = i + 2;

      let fullNameVal = '';
      let emailVal = '';
      let phoneVal = '';
      let addressVal = '';
      let genderVal = '';
      let dobVal = null;
      let hireDateVal = null;
      let departmentVal = '';
      let positionVal = '';
      let statusVal = '';

      for (const [key, value] of Object.entries(row)) {
        const normKey = key.trim().toLowerCase();
        if (normKey === 'full name') fullNameVal = String(value).trim();
        else if (normKey === 'email') emailVal = String(value).trim().toLowerCase();
        else if (normKey === 'phone number' || normKey === 'phone') phoneVal = String(value).trim();
        else if (normKey === 'address') addressVal = String(value).trim();
        else if (normKey === 'gender') genderVal = String(value).trim();
        else if (normKey === 'date of birth') dobVal = value;
        else if (normKey === 'hire date') hireDateVal = value;
        else if (normKey === 'department') departmentVal = String(value).trim();
        else if (normKey === 'position') positionVal = String(value).trim();
        else if (normKey === 'status') statusVal = String(value).trim();
      }

      // Bỏ qua dòng trống hoàn toàn (ví dụ các dòng ví dụ hướng dẫn hoặc dòng thừa cuối file)
      if (!fullNameVal && !emailVal && !departmentVal && !positionVal) {
        continue;
      }

      const rowErrors = [];

      // Validate Họ tên
      if (!fullNameVal) {
        rowErrors.push('Full Name is required');
      }

      const nameParts = fullNameVal.split(/\s+/).filter(Boolean);
      let firstName = '';
      let lastName = '';
      if (nameParts.length > 0) {
        if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = nameParts[0];
        } else {
          firstName = nameParts[nameParts.length - 1];
          lastName = nameParts.slice(0, nameParts.length - 1).join(' ');
        }
      }

      // Validate Email
      if (!emailVal) {
        rowErrors.push('Email is required');
      } else if (!validateGmail(emailVal)) {
        rowErrors.push('Invalid email format');
      } else if (emailInFile.has(emailVal)) {
        rowErrors.push('Duplicate email found in file');
      } else {
        emailInFile.add(emailVal);
        const existingEmp = await Employee.findOne({ email: emailVal });
        if (existingEmp) {
          rowErrors.push('Email already exists in system');
        }
      }

      // Validate Phone (nếu có nhập)
      if (phoneVal && !validatePhone(phoneVal)) {
        rowErrors.push('Phone number must start with 0 and have 10 digits');
      }

      // Validate Address (nếu có nhập)
      if (addressVal && !validateAddress(addressVal)) {
        rowErrors.push('Invalid address (needs at least 3 letters)');
      }

      // Validate Gender (nếu có nhập)
      let matchedGender = undefined;
      if (genderVal) {
        matchedGender = matchGender(genderVal);
        if (!matchedGender) {
          rowErrors.push('Gender must be Male, Female, or Other');
        }
      }

      // Validate Date of Birth (nếu có nhập)
      let dateOfBirth = undefined;
      if (dobVal) {
        const parsedDob = new Date(dobVal);
        if (isNaN(parsedDob.getTime())) {
          rowErrors.push('Invalid Date of Birth format');
        } else {
          const today = new Date();
          if (parsedDob > today) {
            rowErrors.push('Date of birth cannot be in the future');
          } else {
            let age = today.getFullYear() - parsedDob.getFullYear();
            const m = today.getMonth() - parsedDob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < parsedDob.getDate())) {
              age--;
            }
            if (age < 18 || age > 65) {
              rowErrors.push('Employee age must be between 18 and 65');
            }
            dateOfBirth = parsedDob;
          }
        }
      }

      // Validate Hire Date (nếu có nhập)
      let hireDate = undefined;
      if (hireDateVal) {
        const parsedHire = new Date(hireDateVal);
        if (isNaN(parsedHire.getTime())) {
          rowErrors.push('Invalid Hire Date format');
        } else {
          hireDate = parsedHire;
        }
      }

      // Validate Department
      let matchedDept = null;
      if (!departmentVal) {
        rowErrors.push('Department is required');
      } else {
        matchedDept = matchDepartment(departmentVal, departments);
        if (!matchedDept) {
          rowErrors.push('Department does not exist');
        }
      }

      // Validate Position
      let matchedPosition = undefined;
      if (positionVal) {
        matchedPosition = matchPosition(positionVal);
        if (!matchedPosition) {
          rowErrors.push('Invalid Position');
        }
      }

      const matchedStatus = matchStatus(statusVal);

      if (rowErrors.length > 0) {
        errors.push({ row: rowIndex, email: emailVal, errors: rowErrors });
      } else {
        validatedEmployees.push({
          firstName,
          lastName,
          email: emailVal,
          phone: phoneVal || undefined,
          gender: matchedGender || undefined,
          dateOfBirth: dateOfBirth || undefined,
          address: addressVal || undefined,
          position: matchedPosition || undefined,
          hireDate: hireDate || undefined,
          status: matchedStatus,
          department: matchedDept ? matchedDept._id : null
        });
      }
    }

    if (errors.length > 0) {
      return res.status(200).json({
        success: false,
        message: 'Validation failed',
        total: rawRows.length,
        imported: 0,
        failed: errors.length,
        errors
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const savedEmployees = [];
      for (const empData of validatedEmployees) {
        const employee = new Employee(empData);
        const saved = await employee.save({ session });
        savedEmployees.push(saved);

        if (saved.department) {
          await DepartmentHistory.create([{
            employee: saved._id,
            fromDepartment: null,
            toDepartment: saved.department,
            transferDate: saved.hireDate || new Date()
          }], { session });
        }
      }

      await session.commitTransaction();
      session.endSession();

      await logActivity({
        req,
        action: 'IMPORT_EMPLOYEES',
        targetType: 'EMPLOYEE',
        targetName: `Imported ${savedEmployees.length} employees`,
        details: {
          filename: req.file.originalname,
          count: savedEmployees.length,
          employeeIds: savedEmployees.map(e => e._id)
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Import completed successfully',
        total: rawRows.length,
        imported: savedEmployees.length,
        failed: 0,
        errors: []
      });

    } catch (dbErr) {
      await session.abortTransaction();
      session.endSession();
      throw dbErr;
    }

  } catch (err) {
    console.error('Import employees backend failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to import data. Please check the file and try again.',
      error: err.message
    });
  }
};