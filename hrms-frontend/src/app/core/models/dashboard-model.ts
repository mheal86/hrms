export interface DashboardSummary {
  totalEmployees: number;
  totalDepartments: number;
  totalUsers: number;
  activeEmployees: number;
  employeesByDepartment: {
    departmentName: string;
    lastMonthCount: number;
    thisMonthCount: number;
    totalCount: number;
  }[];
}
