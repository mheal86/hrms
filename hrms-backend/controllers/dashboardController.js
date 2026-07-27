const Employee = require('../models/Employee');
const Department = require('../models/Department');
const User = require('../models/User');

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const activeEmployeeIds = await Employee.find({ status: 'ACTIVE' }).distinct('_id');
    const [totalEmployees, totalDepartments, totalUsers, activeEmployees] = await Promise.all([
      Employee.countDocuments(),
      Department.countDocuments(),
      User.countDocuments({ employee: { $in: activeEmployeeIds } }),
      Employee.countDocuments({ status: 'ACTIVE' }),
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const employeesByDepartment = await Employee.aggregate([
      {
        $project: {
          department: 1,
          isLastMonth: { $cond: [{ $lte: ['$hireDate', lastMonthEnd] }, 1, 0] },
          isThisMonth: { $cond: [{ $lte: ['$hireDate', thisMonthEnd] }, 1, 0] },
        },
      },
      {
        $group: {
          _id: '$department',
          lastMonthCount: { $sum: '$isLastMonth' },
          thisMonthCount: { $sum: '$isThisMonth' },
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
        $unwind: {
          path: '$departmentInfo',
          preserveNullAndEmptyArrays: true
        },
      },
      {
        $project: {
          _id: 0,
          departmentName: { $ifNull: ['$departmentInfo.name', 'Chưa phân phòng'] },
          lastMonthCount: 1,
          thisMonthCount: 1,
        },
      },
      {
        $sort: { thisMonthCount: -1 },
      },
    ]);

    const totalEmployeesLastMonth = employeesByDepartment.reduce((sum, item) => sum + item.lastMonthCount, 0);
    const totalEmployeesThisMonth = employeesByDepartment.reduce((sum, item) => sum + item.thisMonthCount, 0);

    employeesByDepartment.unshift({
      departmentName: 'Tổng',
      lastMonthCount: totalEmployeesLastMonth,
      thisMonthCount: totalEmployeesThisMonth,
    });

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