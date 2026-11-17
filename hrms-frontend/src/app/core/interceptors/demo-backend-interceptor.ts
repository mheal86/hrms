import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmployeeStatus } from '../models/employee-model';

interface DemoDepartment {
  _id: string;
  name: string;
  description: string;
  managerName?: string;
  employeeCount?: number;
  createdAt: string;
}

interface DemoEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
  department: { _id: string; name: string };
  createdAt: string;
}

const depts: DemoDepartment[] = [
  {
    _id: 'dept-1',
    name: 'Engineering',
    description: 'ERP Application Support, Database Administration & Internal Systems',
    managerName: 'Nguyễn Minh Hiếu',
    createdAt: '2026-07-01T08:00:00.000Z',
  },
  {
    _id: 'dept-2',
    name: 'Human Resources',
    description: 'Talent Acquisition, Employee Relations & Payroll Operations',
    managerName: 'Trần Thu Hà',
    createdAt: '2026-07-02T08:00:00.000Z',
  },
  {
    _id: 'dept-3',
    name: 'Finance',
    description: 'Accounts Payable, Three-Way Matching & Financial Controls',
    managerName: 'Lê Hoàng Nam',
    createdAt: '2026-07-03T08:00:00.000Z',
  },
  {
    _id: 'dept-4',
    name: 'Marketing',
    description: 'Brand Strategy, Digital Campaigns & Customer Operations',
    managerName: 'Phạm Lan Anh',
    createdAt: '2026-07-05T08:00:00.000Z',
  },
];

const employees: DemoEmployee[] = [
  {
    _id: 'emp-1',
    firstName: 'Hiếu',
    lastName: 'Nguyễn Minh',
    email: 'hieu.nguyen@hrms-demo.vn',
    phone: '0786858048',
    gender: 'Male',
    dateOfBirth: '2005-04-15',
    address: 'District 12, Ho Chi Minh City',
    position: 'Developer',
    hireDate: '2026-07-01',
    status: EmployeeStatus.ACTIVE,
    department: { _id: 'dept-1', name: 'Engineering' },
    createdAt: '2026-07-01T09:00:00.000Z',
  },
  {
    _id: 'emp-2',
    firstName: 'Hà',
    lastName: 'Trần Thu',
    email: 'ha.tran@hrms-demo.vn',
    phone: '0903112233',
    gender: 'Female',
    dateOfBirth: '1998-09-20',
    address: 'District 1, Ho Chi Minh City',
    position: 'HR Specialist',
    hireDate: '2026-07-03',
    status: EmployeeStatus.ACTIVE,
    department: { _id: 'dept-2', name: 'Human Resources' },
    createdAt: '2026-07-03T09:30:00.000Z',
  },
  {
    _id: 'emp-3',
    firstName: 'Nam',
    lastName: 'Lê Hoàng',
    email: 'nam.le@hrms-demo.vn',
    phone: '0918223344',
    gender: 'Male',
    dateOfBirth: '1996-12-10',
    address: 'Binh Thanh District, Ho Chi Minh City',
    position: 'Manager',
    hireDate: '2026-07-05',
    status: EmployeeStatus.ACTIVE,
    department: { _id: 'dept-3', name: 'Finance' },
    createdAt: '2026-07-05T10:00:00.000Z',
  },
  {
    _id: 'emp-4',
    firstName: 'Khánh',
    lastName: 'Võ Quốc',
    email: 'khanh.vo@hrms-demo.vn',
    phone: '0987654321',
    gender: 'Male',
    dateOfBirth: '2001-03-22',
    address: 'Thu Duc City, Ho Chi Minh City',
    position: 'Business Analyst',
    hireDate: '2026-07-12',
    status: EmployeeStatus.ACTIVE,
    department: { _id: 'dept-1', name: 'Engineering' },
    createdAt: '2026-07-12T08:45:00.000Z',
  },
  {
    _id: 'emp-5',
    firstName: 'Anh',
    lastName: 'Phạm Lan',
    email: 'anh.pham@hrms-demo.vn',
    phone: '0938556677',
    gender: 'Female',
    dateOfBirth: '1999-07-18',
    address: 'District 3, Ho Chi Minh City',
    position: 'Designer',
    hireDate: '2026-08-01',
    status: EmployeeStatus.ACTIVE,
    department: { _id: 'dept-4', name: 'Marketing' },
    createdAt: '2026-08-01T09:15:00.000Z',
  },
  {
    _id: 'emp-6',
    firstName: 'Minh',
    lastName: 'Đặng Tuấn',
    email: 'minh.dang@hrms-demo.vn',
    phone: '0977445566',
    gender: 'Male',
    dateOfBirth: '2000-11-05',
    address: 'Tan Binh District, Ho Chi Minh City',
    position: 'QA Engineer',
    hireDate: '2026-08-10',
    status: EmployeeStatus.ACTIVE,
    department: { _id: 'dept-1', name: 'Engineering' },
    createdAt: '2026-08-10T10:20:00.000Z',
  },
  {
    _id: 'emp-7',
    firstName: 'Vy',
    lastName: 'Hoàng Thảo',
    email: 'vy.hoang@hrms-demo.vn',
    phone: '0966889900',
    gender: 'Female',
    dateOfBirth: '2002-01-25',
    address: 'District 7, Ho Chi Minh City',
    position: 'Accountant',
    hireDate: '2026-08-15',
    status: EmployeeStatus.ACTIVE,
    department: { _id: 'dept-3', name: 'Finance' },
    createdAt: '2026-08-15T14:00:00.000Z',
  },
  {
    _id: 'emp-8',
    firstName: 'Bảo',
    lastName: 'Ngô Gia',
    email: 'bao.ngo@hrms-demo.vn',
    phone: '0944332211',
    gender: 'Male',
    dateOfBirth: '1997-06-30',
    address: 'Go Vap District, Ho Chi Minh City',
    position: 'Developer',
    hireDate: '2026-07-10',
    status: EmployeeStatus.INACTIVE,
    department: { _id: 'dept-1', name: 'Engineering' },
    createdAt: '2026-07-10T08:00:00.000Z',
  },
];

const histories: Record<string, Array<{ _id: string; fromDepartment?: { _id: string; name: string }; toDepartment: { _id: string; name: string }; transferDate: string }>> = {
  'emp-1': [
    {
      _id: 'hist-1',
      toDepartment: { _id: 'dept-1', name: 'Engineering' },
      transferDate: '2026-07-01T09:00:00.000Z',
    },
  ],
  'emp-4': [
    {
      _id: 'hist-2',
      toDepartment: { _id: 'dept-3', name: 'Finance' },
      transferDate: '2026-07-12T08:45:00.000Z',
    },
    {
      _id: 'hist-3',
      fromDepartment: { _id: 'dept-3', name: 'Finance' },
      toDepartment: { _id: 'dept-1', name: 'Engineering' },
      transferDate: '2026-08-15T10:15:00.000Z',
    },
  ],
};

const auditLogs: Array<{
  _id: string;
  userId: { _id: string; username: string };
  username: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  details: unknown;
  createdAt: string;
}> = [
  {
    _id: 'log-105',
    userId: { _id: 'u-admin', username: 'admin' },
    username: 'admin',
    action: 'TRANSFER_EMPLOYEE',
    targetType: 'Employee',
    targetId: 'emp-4',
    targetName: 'Võ Quốc Khánh',
    details: {
      before: { department: 'Finance', position: 'Accountant' },
      after: { department: 'Engineering', position: 'Business Analyst' },
    },
    createdAt: '2026-08-15T10:15:00.000Z',
  },
  {
    _id: 'log-104',
    userId: { _id: 'u-admin', username: 'admin' },
    username: 'admin',
    action: 'UPDATE_EMPLOYEE',
    targetType: 'Employee',
    targetId: 'emp-8',
    targetName: 'Ngô Gia Bảo',
    details: {
      before: { status: 'ACTIVE', phone: '0944000111' },
      after: { status: 'INACTIVE', phone: '0944332211' },
    },
    createdAt: '2026-08-14T16:30:00.000Z',
  },
  {
    _id: 'log-103',
    userId: { _id: 'u-admin', username: 'admin' },
    username: 'admin',
    action: 'CREATE_EMPLOYEE',
    targetType: 'Employee',
    targetId: 'emp-7',
    targetName: 'Hoàng Thảo Vy',
    details: {
      email: 'vy.hoang@hrms-demo.vn',
      position: 'Accountant',
      department: 'Finance',
      status: 'ACTIVE',
    },
    createdAt: '2026-08-15T14:00:00.000Z',
  },
  {
    _id: 'log-102',
    userId: { _id: 'u-admin', username: 'admin' },
    username: 'admin',
    action: 'UPDATE_DEPARTMENT',
    targetType: 'Department',
    targetId: 'dept-1',
    targetName: 'Engineering',
    details: {
      before: { description: 'Software Development Team' },
      after: { description: 'ERP Application Support, Database Administration & Internal Systems' },
    },
    createdAt: '2026-08-05T11:20:00.000Z',
  },
  {
    _id: 'log-101',
    userId: { _id: 'u-admin', username: 'admin' },
    username: 'admin',
    action: 'CREATE_DEPARTMENT',
    targetType: 'Department',
    targetId: 'dept-4',
    targetName: 'Marketing',
    details: {
      name: 'Marketing',
      description: 'Brand Strategy, Digital Campaigns & Customer Operations',
    },
    createdAt: '2026-07-05T08:00:00.000Z',
  },
];

function handleDemoRequest(reqUrl: string, method: string, body: any, params: any): HttpResponse<any> | null {
  if (!reqUrl.includes('/api/')) return null;
  const path = reqUrl.split('/api/')[1].split('?')[0];

  // 1. Auth login
  if (path === 'auth/login' && method === 'POST') {
    const username = (body?.username || 'admin').trim();
    const role = username.toLowerCase() === 'user' || username.toLowerCase() === 'staff' ? 'USER' : 'ADMIN';
    return new HttpResponse({
      status: 200,
      body: {
        token: 'demo-jwt-token-ey-ams-preview',
        user: {
          id: role === 'ADMIN' ? 'u-admin' : 'u-staff',
          username: username || 'admin',
          role,
        },
      },
    });
  }

  // 2. Dashboard summary
  if (path === 'dashboard/summary' && method === 'GET') {
    const activeCount = employees.filter((e) => e.status === EmployeeStatus.ACTIVE).length;
    const byDept = depts.map((d) => {
      const count = employees.filter(
        (e) => (typeof e.department === 'object' ? e.department._id : e.department) === d._id,
      ).length;
      return {
        departmentName: d.name,
        lastMonthCount: Math.max(1, count - 1),
        thisMonthCount: 1,
        totalCount: count,
      };
    });
    return new HttpResponse({
      status: 200,
      body: {
        totalEmployees: employees.length,
        totalDepartments: depts.length,
        totalUsers: 4,
        activeEmployees: activeCount,
        employeesByDepartment: byDept,
      },
    });
  }

  // 3. Departments
  if (path === 'departments' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    const page = Number(params.get('page') || 1);
    const limit = Number(params.get('limit') || 10);
    const enriched = depts
      .map((d) => ({
        ...d,
        employeeCount: employees.filter(
          (e) => (typeof e.department === 'object' ? e.department._id : e.department) === d._id,
        ).length,
      }))
      .filter((d) => !search || d.name.toLowerCase().includes(search) || d.description.toLowerCase().includes(search));
    return new HttpResponse({
      status: 200,
      body: {
        data: enriched.slice((page - 1) * limit, page * limit),
        pagination: {
          total: enriched.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(enriched.length / limit)),
        },
      },
    });
  }

  if (path.startsWith('departments/') && method === 'GET') {
    const id = path.split('/')[1];
    const found = depts.find((d) => d._id === id) ?? depts[0];
    return new HttpResponse({ status: 200, body: found });
  }

  if (path === 'departments' && method === 'POST') {
    const newDept: DemoDepartment = {
      _id: `dept-${Date.now()}`,
      name: body?.name || 'New Department',
      description: body?.description || '',
      createdAt: new Date().toISOString(),
    };
    depts.unshift(newDept);
    auditLogs.unshift({
      _id: `log-${Date.now()}`,
      userId: { _id: 'u-admin', username: 'admin' },
      username: 'admin',
      action: 'CREATE_DEPARTMENT',
      targetType: 'Department',
      targetId: newDept._id,
      targetName: newDept.name,
      details: { name: newDept.name, description: newDept.description },
      createdAt: new Date().toISOString(),
    });
    return new HttpResponse({ status: 201, body: newDept });
  }

  if (path.startsWith('departments/') && method === 'PUT') {
    const id = path.split('/')[1];
    const idx = depts.findIndex((d) => d._id === id);
    if (idx !== -1) {
      const before = { ...depts[idx] };
      depts[idx] = { ...depts[idx], ...body };
      auditLogs.unshift({
        _id: `log-${Date.now()}`,
        userId: { _id: 'u-admin', username: 'admin' },
        username: 'admin',
        action: 'UPDATE_DEPARTMENT',
        targetType: 'Department',
        targetId: id,
        targetName: depts[idx].name,
        details: { before: { name: before.name, description: before.description }, after: { name: depts[idx].name, description: depts[idx].description } },
        createdAt: new Date().toISOString(),
      });
      return new HttpResponse({ status: 200, body: depts[idx] });
    }
  }

  // 4. Employees
  if (path === 'employees' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    const deptFilter = params.get('department') || '';
    const statusFilter = params.get('status') || '';
    const page = Number(params.get('page') || 1);
    const limit = Number(params.get('limit') || 10);

    const filtered = employees.filter((e) => {
      const full = `${e.lastName} ${e.firstName} ${e.email}`.toLowerCase();
      if (search && !full.includes(search)) return false;
      const dId = typeof e.department === 'object' ? e.department._id : e.department;
      if (deptFilter && dId !== deptFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      return true;
    });

    return new HttpResponse({
      status: 200,
      body: {
        data: filtered.slice((page - 1) * limit, page * limit),
        pagination: {
          total: filtered.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
        },
      },
    });
  }

  if (path.endsWith('/history') && path.startsWith('employees/') && method === 'GET') {
    const id = path.split('/')[1];
    const emp = employees.find((e) => e._id === id) ?? employees[0];
    const list = histories[id] ?? [
      {
        _id: `hist-${id}`,
        toDepartment: emp.department,
        transferDate: emp.createdAt,
      },
    ];
    return new HttpResponse({ status: 200, body: list });
  }

  if (path.startsWith('employees/') && method === 'GET') {
    const id = path.split('/')[1];
    const emp = employees.find((e) => e._id === id) ?? employees[0];
    return new HttpResponse({ status: 200, body: emp });
  }

  if (path === 'employees' && method === 'POST') {
    const deptObj = depts.find((d) => d._id === body?.department) ?? depts[0];
    const newEmp: DemoEmployee = {
      _id: `emp-${Date.now()}`,
      firstName: body?.firstName || 'New',
      lastName: body?.lastName || 'Employee',
      email: body?.email || 'employee@hrms-demo.vn',
      phone: body?.phone || '0900112233',
      gender: body?.gender || 'Male',
      dateOfBirth: body?.dateOfBirth || '2000-01-01',
      address: body?.address || 'Ho Chi Minh City',
      position: body?.position || 'Developer',
      hireDate: body?.hireDate || new Date().toISOString().slice(0, 10),
      status: (body?.status as EmployeeStatus) || EmployeeStatus.ACTIVE,
      department: { _id: deptObj._id, name: deptObj.name },
      createdAt: new Date().toISOString(),
    };
    employees.unshift(newEmp);
    auditLogs.unshift({
      _id: `log-${Date.now()}`,
      userId: { _id: 'u-admin', username: 'admin' },
      username: 'admin',
      action: 'CREATE_EMPLOYEE',
      targetType: 'Employee',
      targetId: newEmp._id,
      targetName: `${newEmp.lastName} ${newEmp.firstName}`,
      details: { email: newEmp.email, position: newEmp.position, department: deptObj.name, status: newEmp.status },
      createdAt: new Date().toISOString(),
    });
    return new HttpResponse({ status: 201, body: newEmp });
  }

  if (path.startsWith('employees/') && method === 'PUT') {
    const id = path.split('/')[1];
    const idx = employees.findIndex((e) => e._id === id);
    if (idx !== -1) {
      const prev = employees[idx];
      const nextDeptId = typeof body?.department === 'object' ? body.department._id : (body?.department || prev.department._id);
      const nextDept = depts.find((d) => d._id === nextDeptId) ?? prev.department;
      const isTransfer = prev.department._id !== nextDept._id;

      employees[idx] = {
        ...prev,
        ...body,
        department: { _id: nextDept._id, name: nextDept.name },
      };

      if (isTransfer) {
        histories[id] = histories[id] ?? [];
        histories[id].unshift({
          _id: `hist-${Date.now()}`,
          fromDepartment: prev.department,
          toDepartment: { _id: nextDept._id, name: nextDept.name },
          transferDate: new Date().toISOString(),
        });
      }

      auditLogs.unshift({
        _id: `log-${Date.now()}`,
        userId: { _id: 'u-admin', username: 'admin' },
        username: 'admin',
        action: isTransfer ? 'TRANSFER_EMPLOYEE' : 'UPDATE_EMPLOYEE',
        targetType: 'Employee',
        targetId: id,
        targetName: `${employees[idx].lastName} ${employees[idx].firstName}`,
        details: {
          before: { department: prev.department.name, position: prev.position, status: prev.status },
          after: { department: nextDept.name, position: employees[idx].position, status: employees[idx].status },
        },
        createdAt: new Date().toISOString(),
      });

      return new HttpResponse({ status: 200, body: employees[idx] });
    }
  }

  // 5. Audit logs
  if (path === 'audit-logs/actions' && method === 'GET') {
    return new HttpResponse({
      status: 200,
      body: [
        'CREATE_EMPLOYEE',
        'UPDATE_EMPLOYEE',
        'TRANSFER_EMPLOYEE',
        'DELETE_EMPLOYEE',
        'CREATE_DEPARTMENT',
        'UPDATE_DEPARTMENT',
      ],
    });
  }

  if (path === 'audit-logs/users' && method === 'GET') {
    return new HttpResponse({
      status: 200,
      body: [
        { _id: 'u-admin', username: 'admin' },
        { _id: 'u-staff', username: 'staff' },
      ],
    });
  }

  if (path === 'audit-logs' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    const action = params.get('action') || '';
    const page = Number(params.get('page') || 1);
    const limit = Number(params.get('limit') || 7);

    const filtered = auditLogs.filter((l) => {
      if (action && l.action !== action) return false;
      if (search && !l.targetName.toLowerCase().includes(search) && !l.username.toLowerCase().includes(search)) return false;
      return true;
    });

    return new HttpResponse({
      status: 200,
      body: {
        data: filtered.slice((page - 1) * limit, page * limit),
        pagination: {
          total: filtered.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
        },
      },
    });
  }

  // 6. Profile & Users
  if (path === 'profile' && method === 'GET') {
    return new HttpResponse({
      status: 200,
      body: {
        _id: 'u-admin',
        username: 'admin',
        role: { _id: 'r-admin', name: 'ADMIN' },
        employee: employees[0],
      },
    });
  }

  if (path.startsWith('users/by-employee/') && method === 'GET') {
    return new HttpResponse({
      status: 200,
      body: {
        _id: 'u-admin',
        username: 'admin',
        role: { _id: 'r-admin', name: 'ADMIN' },
      },
    });
  }

  if (path.startsWith('users/check-username') && method === 'GET') {
    return new HttpResponse({ status: 200, body: { exists: false } });
  }

  return new HttpResponse({ status: 200, body: { success: true } });
}

let forceDemoMode = false;

export const demoBackendInterceptor: HttpInterceptorFn = (req, next): Observable<any> => {
  if (forceDemoMode && req.url.includes('/api/')) {
    const demoRes = handleDemoRequest(req.url, req.method, req.body, req.params);
    if (demoRes) return of(demoRes);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (req.url.includes('/api/')) {
        forceDemoMode = true;
        const demoRes = handleDemoRequest(req.url, req.method, req.body, req.params);
        if (demoRes) return of(demoRes);
      }
      return throwError(() => err);
    }),
  );
};
