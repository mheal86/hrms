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

    const allDepts = await Department.find();

    const activeEmployeesByDept = await Employee.aggregate([
      {
        $match: { status: 'ACTIVE' },
      },
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
    ]);

    const countMap = {};
    activeEmployeesByDept.forEach((item) => {
      if (item._id) {
        countMap[item._id.toString()] = {
          lastMonthCount: item.lastMonthCount,
          thisMonthCount: item.thisMonthCount,
        };
      } else {
        countMap['unassigned'] = {
          lastMonthCount: item.lastMonthCount,
          thisMonthCount: item.thisMonthCount,
        };
      }
    });

    const employeesByDepartment = allDepts.map((dept) => {
      const counts = countMap[dept._id.toString()] || { lastMonthCount: 0, thisMonthCount: 0 };
      return {
        departmentName: dept.name,
        lastMonthCount: counts.lastMonthCount,
        thisMonthCount: counts.thisMonthCount,
      };
    });

    if (countMap['unassigned']) {
      employeesByDepartment.push({
        departmentName: 'Chưa phân phòng',
        lastMonthCount: countMap['unassigned'].lastMonthCount,
        thisMonthCount: countMap['unassigned'].thisMonthCount,
      });
    }

    employeesByDepartment.sort((a, b) => b.thisMonthCount - a.thisMonthCount);

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