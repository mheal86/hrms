const Employee = require('../models/Employee');
const Department = require('../models/Department');
const User = require('../models/User');

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const [totalEmployees, totalDepartments, totalUsers, activeEmployees] = await Promise.all([
      Employee.countDocuments(),
      Department.countDocuments(),
      User.countDocuments(),
      Employee.countDocuments({ status: 'ACTIVE' }),
    ]);

    const employeesByDepartment = await Employee.aggregate([
  {
    $group: {
      _id: '$department',
      count: { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: 'departments',
      localField: '_id',
      foreignField: '_id',
      as: 'departmentInfo',
    },
  },
  {
    $unwind: '$departmentInfo',
  },
  {
    $project: {
      _id: 0,
      departmentName: '$departmentInfo.name',
      count: 1,
    },
  },
  {
    $sort: { count: -1 },
  },
]);

    res.status(200).json({
      totalEmployees,
      totalDepartments,
      totalUsers,
      activeEmployees,
      employeesByDepartment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};