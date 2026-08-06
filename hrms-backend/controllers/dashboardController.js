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

    // Last month boundaries
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // This month boundaries
    const thisMonthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const allDepts = await Department.find();

    const activeEmployeesByDept = await Employee.aggregate([
      {
        $match: { status: 'ACTIVE' }
      },
      {
        $project: {
          department: 1,
          isLastMonth: {
            $cond: [
              {
                $and: [
                  { $ne: ['$hireDate', null] },
                  { $gte: ['$hireDate', lastMonthStart] },
                  { $lte: ['$hireDate', lastMonthEnd] }
                ]
              },
              1,
              0
            ]
          },
          isThisMonth: {
            $cond: [
              {
                $and: [
                  { $ne: ['$hireDate', null] },
                  { $gte: ['$hireDate', thisMonthStart] },
                  { $lte: ['$hireDate', thisMonthEnd] }
                ]
              },
              1,
              0
            ]
          }
        },
      },
      {
        $group: {
          _id: '$department',
          lastMonthCount: { $sum: '$isLastMonth' },
          thisMonthCount: { $sum: '$isThisMonth' },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    activeEmployeesByDept.forEach((item) => {
      if (item._id) {
        countMap[item._id.toString()] = {
          lastMonthCount: item.lastMonthCount,
          thisMonthCount: item.thisMonthCount,
          totalCount: item.totalCount,
        };
      } else {
        countMap['unassigned'] = {
          lastMonthCount: item.lastMonthCount,
          thisMonthCount: item.thisMonthCount,
          totalCount: item.totalCount,
        };
      }
    });

    const employeesByDepartment = allDepts.map((dept) => {
      const counts = countMap[dept._id.toString()] || { lastMonthCount: 0, thisMonthCount: 0, totalCount: 0 };
      return {
        departmentName: dept.name,
        lastMonthCount: counts.lastMonthCount,
        thisMonthCount: counts.thisMonthCount,
        totalCount: counts.totalCount,
      };
    });

    if (countMap['unassigned']) {
      employeesByDepartment.push({
        departmentName: 'Chưa phân phòng',
        lastMonthCount: countMap['unassigned'].lastMonthCount,
        thisMonthCount: countMap['unassigned'].thisMonthCount,
        totalCount: countMap['unassigned'].totalCount,
      });
    }

    employeesByDepartment.sort((a, b) => b.totalCount - a.totalCount);

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