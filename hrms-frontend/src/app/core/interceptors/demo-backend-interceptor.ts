import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as XLSX from 'xlsx';
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
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  address: string;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
  deactivatedDate?: string | null;
  department: { _id: string; name: string };
  createdAt: string;
}

let idCounter = 900;
function nextObjectId(prefix = '66800000000000000000'): string {
  idCounter += 1;
  return `${prefix}${String(idCounter).padStart(4, '0')}`;
}

const LEGACY_ID_MAP: Record<string, string> = {
  'dept-1': '668000000000000000000101',
  'dept-2': '668000000000000000000102',
  'dept-3': '668000000000000000000103',
  'dept-4': '668000000000000000000104',
  'emp-1': '668000000000000000000201',
  'emp-2': '668000000000000000000202',
  'emp-3': '668000000000000000000203',
  'emp-4': '668000000000000000000204',
  'emp-5': '668000000000000000000205',
  'emp-6': '668000000000000000000206',
  'emp-7': '668000000000000000000207',
  'emp-8': '668000000000000000000208',
};

function resolveId(rawId?: string | null): string {
  if (!rawId) return '';
  return LEGACY_ID_MAP[rawId] ?? rawId;
}

const depts: DemoDepartment[] = [
  {
    _id: '668000000000000000000101',
    name: 'Phòng Công nghệ thông tin',
    description: 'Quản lý hạ tầng công nghệ và phát triển phần mềm',
    managerName: 'Nguyễn Văn An',
    createdAt: '2026-07-01T08:00:00.000Z',
  },
  {
    _id: '668000000000000000000102',
    name: 'Phòng Nhân sự',
    description: 'Hoạch định, tuyển dụng, đào tạo và phát triển nhân sự',
    managerName: 'Trần Thu Hà',
    createdAt: '2026-07-02T08:00:00.000Z',
  },
  {
    _id: '668000000000000000000103',
    name: 'Phòng Kế toán',
    description: 'Quản lý tài chính và kế toán doanh nghiệp',
    managerName: 'Lê Hoàng Nam',
    createdAt: '2026-07-03T08:00:00.000Z',
  },
  {
    _id: '668000000000000000000104',
    name: 'Phòng Marketing',
    description: 'Xây dựng, phát triển thương hiệu và quảng bá sản phẩm',
    managerName: 'Phạm Ngọc Lan',
    createdAt: '2026-07-05T08:00:00.000Z',
  },
];

const employees: DemoEmployee[] = [
  {
    _id: '668000000000000000000201',
    firstName: 'An',
    lastName: 'Nguyễn Văn',
    email: 'an.nguyen@company-demo.vn',
    phone: '0901234561',
    gender: 'MALE',
    dateOfBirth: '1993-05-12',
    address: 'District 1, Ho Chi Minh City',
    position: 'Trưởng phòng',
    hireDate: '2024-03-01',
    status: EmployeeStatus.ACTIVE,
    department: { _id: '668000000000000000000101', name: 'Phòng Công nghệ thông tin' },
    createdAt: '2026-07-01T09:00:00.000Z',
  },
  {
    _id: '668000000000000000000202',
    firstName: 'Hà',
    lastName: 'Trần Thu',
    email: 'ha.tran@company-demo.vn',
    phone: '0901234562',
    gender: 'FEMALE',
    dateOfBirth: '1995-09-20',
    address: 'District 3, Ho Chi Minh City',
    position: 'Trưởng phòng',
    hireDate: '2024-05-10',
    status: EmployeeStatus.ACTIVE,
    department: { _id: '668000000000000000000102', name: 'Phòng Nhân sự' },
    createdAt: '2026-07-03T09:30:00.000Z',
  },
  {
    _id: '668000000000000000000203',
    firstName: 'Nam',
    lastName: 'Lê Hoàng',
    email: 'nam.le@company-demo.vn',
    phone: '0901234563',
    gender: 'MALE',
    dateOfBirth: '1994-12-10',
    address: 'Binh Thanh District, Ho Chi Minh City',
    position: 'Phó phòng',
    hireDate: '2024-08-01',
    status: EmployeeStatus.ACTIVE,
    department: { _id: '668000000000000000000103', name: 'Phòng Kế toán' },
    createdAt: '2026-07-05T10:00:00.000Z',
  },
  {
    _id: '668000000000000000000204',
    firstName: 'Khánh',
    lastName: 'Võ Quốc',
    email: 'khanh.vo@company-demo.vn',
    phone: '0901234564',
    gender: 'MALE',
    dateOfBirth: '1997-08-22',
    address: 'Thu Duc City, Ho Chi Minh City',
    position: 'Trưởng nhóm',
    hireDate: '2025-06-15',
    status: EmployeeStatus.ACTIVE,
    department: { _id: '668000000000000000000101', name: 'Phòng Công nghệ thông tin' },
    createdAt: '2026-07-12T08:45:00.000Z',
  },
  {
    _id: '668000000000000000000205',
    firstName: 'Lan',
    lastName: 'Phạm Ngọc',
    email: 'lan.pham@company-demo.vn',
    phone: '0901234565',
    gender: 'FEMALE',
    dateOfBirth: '1998-07-18',
    address: 'Phu Nhuan District, Ho Chi Minh City',
    position: 'Trưởng nhóm',
    hireDate: '2025-09-01',
    status: EmployeeStatus.ACTIVE,
    department: { _id: '668000000000000000000104', name: 'Phòng Marketing' },
    createdAt: '2026-08-01T09:15:00.000Z',
  },
  {
    _id: '668000000000000000000206',
    firstName: 'Linh',
    lastName: 'Đặng Ngọc',
    email: 'linh.dang@company-demo.vn',
    phone: '0901234566',
    gender: 'FEMALE',
    dateOfBirth: '2000-11-05',
    address: 'Tan Binh District, Ho Chi Minh City',
    position: 'Nhân viên',
    hireDate: '2026-08-10',
    status: EmployeeStatus.ACTIVE,
    department: { _id: '668000000000000000000101', name: 'Phòng Công nghệ thông tin' },
    createdAt: '2026-08-10T10:20:00.000Z',
  },
  {
    _id: '668000000000000000000207',
    firstName: 'Vy',
    lastName: 'Hoàng Thảo',
    email: 'vy.hoang@company-demo.vn',
    phone: '0901234567',
    gender: 'FEMALE',
    dateOfBirth: '1999-01-25',
    address: 'District 7, Ho Chi Minh City',
    position: 'Nhân viên',
    hireDate: '2026-08-15',
    status: EmployeeStatus.ACTIVE,
    department: { _id: '668000000000000000000103', name: 'Phòng Kế toán' },
    createdAt: '2026-08-15T14:00:00.000Z',
  },
  {
    _id: '668000000000000000000208',
    firstName: 'Bảo',
    lastName: 'Ngô Gia',
    email: 'bao.ngo@company-demo.vn',
    phone: '0901234568',
    gender: 'MALE',
    dateOfBirth: '2002-06-30',
    address: 'District 10, Ho Chi Minh City',
    position: 'Thực tập sinh',
    hireDate: '2026-07-10',
    status: EmployeeStatus.INACTIVE,
    deactivatedDate: '2026-08-14T16:30:00.000Z',
    department: { _id: '668000000000000000000101', name: 'Phòng Công nghệ thông tin' },
    createdAt: '2026-07-10T08:00:00.000Z',
  },
];

const histories: Record<
  string,
  Array<{
    _id: string;
    fromDepartment?: { _id: string; name: string };
    toDepartment: { _id: string; name: string };
    transferDate: string;
  }>
> = {
  '668000000000000000000201': [
    {
      _id: '668000000000000000000401',
      toDepartment: { _id: '668000000000000000000101', name: 'Phòng Công nghệ thông tin' },
      transferDate: '2024-03-01T08:00:00.000Z',
    },
  ],
  '668000000000000000000204': [
    {
      _id: '668000000000000000000403',
      fromDepartment: { _id: '668000000000000000000103', name: 'Phòng Kế toán' },
      toDepartment: { _id: '668000000000000000000101', name: 'Phòng Công nghệ thông tin' },
      transferDate: '2026-08-15T10:15:00.000Z',
    },
    {
      _id: '668000000000000000000402',
      toDepartment: { _id: '668000000000000000000103', name: 'Phòng Kế toán' },
      transferDate: '2025-06-15T08:45:00.000Z',
    },
  ],
};

const demoUsers = [
  {
    _id: '668000000000000000000001',
    username: 'admin',
    role: { _id: '668000000000000000000011', name: 'ADMIN' },
    employeeId: '668000000000000000000201',
  },
  {
    _id: '668000000000000000000002',
    username: 'staff',
    role: { _id: '668000000000000000000012', name: 'USER' },
    employeeId: '668000000000000000000202',
  },
  {
    _id: '668000000000000000000003',
    username: 'nam.le',
    role: { _id: '668000000000000000000012', name: 'USER' },
    employeeId: '668000000000000000000203',
  },
  {
    _id: '668000000000000000000004',
    username: 'khanh.vo',
    role: { _id: '668000000000000000000012', name: 'USER' },
    employeeId: '668000000000000000000204',
  },
  {
    _id: '668000000000000000000005',
    username: 'lan.pham',
    role: { _id: '668000000000000000000012', name: 'USER' },
    employeeId: '668000000000000000000205',
  },
  {
    _id: '668000000000000000000006',
    username: 'linh.dang',
    role: { _id: '668000000000000000000012', name: 'USER' },
    employeeId: '668000000000000000000206',
  },
  {
    _id: '668000000000000000000007',
    username: 'vy.hoang',
    role: { _id: '668000000000000000000012', name: 'USER' },
    employeeId: '668000000000000000000207',
  },
  {
    _id: '668000000000000000000008',
    username: 'bao.ngo',
    role: { _id: '668000000000000000000012', name: 'USER' },
    employeeId: '668000000000000000000208',
  },
];

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
    _id: '668000000000000000000305',
    userId: { _id: '668000000000000000000001', username: 'admin' },
    username: 'admin',
    action: 'CREATE_EMPLOYEE',
    targetType: 'EMPLOYEE',
    targetId: '668000000000000000000207',
    targetName: 'Vy Hoàng Thảo',
    details: {
      email: 'vy.hoang@company-demo.vn',
      position: 'Nhân viên',
      department: 'Phòng Kế toán',
      status: 'ACTIVE',
    },
    createdAt: '2026-08-15T14:00:00.000Z',
  },
  {
    _id: '668000000000000000000304',
    userId: { _id: '668000000000000000000001', username: 'admin' },
    username: 'admin',
    action: 'TRANSFER_EMPLOYEE',
    targetType: 'EMPLOYEE',
    targetId: '668000000000000000000204',
    targetName: 'Khánh Võ Quốc',
    details: {
      before: { department: 'Phòng Kế toán', position: 'Nhân viên' },
      after: { department: 'Phòng Công nghệ thông tin', position: 'Trưởng nhóm' },
    },
    createdAt: '2026-08-15T10:15:00.000Z',
  },
  {
    _id: '668000000000000000000303',
    userId: { _id: '668000000000000000000001', username: 'admin' },
    username: 'admin',
    action: 'UPDATE_EMPLOYEE',
    targetType: 'EMPLOYEE',
    targetId: '668000000000000000000208',
    targetName: 'Bảo Ngô Gia',
    details: {
      before: { status: 'ACTIVE', phone: '0901234500' },
      after: { status: 'INACTIVE', phone: '0901234568' },
    },
    createdAt: '2026-08-14T16:30:00.000Z',
  },
  {
    _id: '668000000000000000000302',
    userId: { _id: '668000000000000000000001', username: 'admin' },
    username: 'admin',
    action: 'UPDATE_DEPARTMENT',
    targetType: 'DEPARTMENT',
    targetId: '668000000000000000000101',
    targetName: 'Phòng Công nghệ thông tin',
    details: {
      before: { description: 'Quản lý hệ thống nội bộ' },
      after: { description: 'Quản lý hạ tầng công nghệ và phát triển phần mềm' },
    },
    createdAt: '2026-08-05T11:20:00.000Z',
  },
  {
    _id: '668000000000000000000301',
    userId: { _id: '668000000000000000000001', username: 'admin' },
    username: 'admin',
    action: 'CREATE_DEPARTMENT',
    targetType: 'DEPARTMENT',
    targetId: '668000000000000000000104',
    targetName: 'Phòng Marketing',
    details: {
      name: 'Phòng Marketing',
      description: 'Xây dựng, phát triển thương hiệu và quảng bá sản phẩm',
    },
    createdAt: '2026-07-05T08:00:00.000Z',
  },
];

function getCurrentDemoUser() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      const found = demoUsers.find(
        (u) => u._id === parsed.id || u.username === parsed.username,
      );
      if (found) return found;
    }
  } catch {
    /* ignore storage errors */
  }
  return demoUsers[0];
}

function normText(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchDemoDepartment(deptStr: string): DemoDepartment | null {
  if (!deptStr) return null;
  const normalizedInput = normText(deptStr);
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
    { keys: ['training', 'dao tao'], val: 'Đào tạo' },
  ];

  let matchedVal: string | null = null;
  for (const item of mappings) {
    if (item.keys.some((k) => normalizedInput.includes(k) || k.includes(normalizedInput))) {
      matchedVal = item.val;
      break;
    }
  }

  for (const dept of depts) {
    const normalizedDbName = normText(dept.name);
    if (normalizedDbName === normalizedInput) return dept;
    if (matchedVal) {
      const normalizedMapped = normText(matchedVal);
      if (normalizedDbName.includes(normalizedMapped) || normalizedMapped.includes(normalizedDbName)) {
        return dept;
      }
    }
    if (normalizedDbName.includes(normalizedInput) || normalizedInput.includes(normalizedDbName)) {
      return dept;
    }
  }
  return null;
}

function matchDemoGender(genderStr: string): 'MALE' | 'FEMALE' | 'OTHER' | undefined {
  if (!genderStr) return undefined;
  const g = normText(genderStr);
  if (['nam', 'male', 'm'].includes(g)) return 'MALE';
  if (['nu', 'female', 'f'].includes(g)) return 'FEMALE';
  if (['khac', 'other', 'o'].includes(g)) return 'OTHER';
  return undefined;
}

function matchDemoPosition(positionStr: string): string | undefined {
  if (!positionStr) return undefined;
  const p = normText(positionStr);
  const positionMap: Record<string, string> = {
    'nhân viên': 'Nhân viên',
    staff: 'Nhân viên',
    employee: 'Nhân viên',
    'trưởng nhóm': 'Trưởng nhóm',
    'team leader': 'Trưởng nhóm',
    leader: 'Trưởng nhóm',
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
    gd: 'Giám đốc',
    'thực tập sinh': 'Thực tập sinh',
    intern: 'Thực tập sinh',
  };
  for (const [key, value] of Object.entries(positionMap)) {
    const normKey = normText(key);
    if (p === normKey || p.includes(normKey)) return value;
  }
  return undefined;
}

function matchDemoStatus(statusStr: string): EmployeeStatus {
  if (!statusStr) return EmployeeStatus.ACTIVE;
  const s = normText(statusStr);
  if (['ngung hoat dong', 'khong hoat dong', 'inactive', 'i'].includes(s)) {
    return EmployeeStatus.INACTIVE;
  }
  return EmployeeStatus.ACTIVE;
}

function handleExcelImport(file: File): Observable<HttpResponse<any>> {
  return from(file.arrayBuffer()).pipe(
    map((buf) => {
      const workbook = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      if (rawRows.length === 0) {
        return new HttpResponse({
          status: 200,
          body: { success: false, message: 'The Excel file is empty', total: 0, imported: 0, failed: 0, errors: [] },
        });
      }

      const headers = Object.keys(rawRows[0]).map((h) => h.trim().toLowerCase());
      if (!headers.includes('full name') || !headers.includes('email')) {
        return new HttpResponse({
          status: 200,
          body: {
            success: false,
            message: 'File is missing required columns. Ensure "Full Name" and "Email" exist.',
            total: rawRows.length,
            imported: 0,
            failed: rawRows.length,
            errors: [],
          },
        });
      }

      const errors: Array<{ row: number; email: string; errors: string[] }> = [];
      const toCreate: DemoEmployee[] = [];
      const existingEmails = new Set(employees.map((e) => e.email.toLowerCase()));
      const emailInFile = new Set<string>();
      const actor = getCurrentDemoUser();

      rawRows.forEach((row, index) => {
        const rowIndex = index + 2;
        let fullNameVal = '';
        let emailVal = '';
        let phoneVal = '';
        let addressVal = '';
        let genderVal = '';
        let dobVal: unknown = null;
        let hireDateVal: unknown = null;
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

        if (!fullNameVal && !emailVal && !departmentVal && !positionVal) return;

        const rowErrors: string[] = [];
        if (!fullNameVal) rowErrors.push('Full Name is required');

        if (!emailVal) {
          rowErrors.push('Email is required');
        } else if (!/^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailVal)) {
          rowErrors.push('Invalid email format');
        } else if (emailInFile.has(emailVal)) {
          rowErrors.push('Duplicate email found in file');
        } else {
          emailInFile.add(emailVal);
          if (existingEmails.has(emailVal)) {
            rowErrors.push('Email already exists in system');
          }
        }

        if (phoneVal && !/^0\d{9}$/.test(phoneVal)) {
          rowErrors.push('Phone number must start with 0 and have 10 digits');
        }

        const matchedDept = matchDemoDepartment(departmentVal);
        if (!departmentVal || !matchedDept) {
          rowErrors.push('Department does not exist');
        }

        const matchedGender = genderVal ? matchDemoGender(genderVal) : 'OTHER';
        if (genderVal && !matchedGender) {
          rowErrors.push('Gender must be Male, Female, or Other');
        }

        const matchedPosition = positionVal ? matchDemoPosition(positionVal) : 'Nhân viên';
        if (positionVal && !matchedPosition) {
          rowErrors.push('Invalid Position');
        }

        if (rowErrors.length > 0) {
          errors.push({ row: rowIndex, email: emailVal, errors: rowErrors });
          return;
        }

        const nameParts = fullNameVal.split(/\s+/).filter(Boolean);
        const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : fullNameVal;
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

        const parsedDob = dobVal ? new Date(dobVal as string | number | Date) : null;
        const dobIso =
          parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob.toISOString().slice(0, 10) : '1998-01-01';
        const parsedHire = hireDateVal ? new Date(hireDateVal as string | number | Date) : null;
        const hireIso =
          parsedHire && !isNaN(parsedHire.getTime())
            ? parsedHire.toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10);

        const nowIso = new Date().toISOString();
        const empId = nextObjectId();
        toCreate.push({
          _id: empId,
          firstName,
          lastName,
          email: emailVal,
          phone: phoneVal || '0900000000',
          gender: matchedGender || 'OTHER',
          dateOfBirth: dobIso,
          address: addressVal || 'Ho Chi Minh City',
          position: matchedPosition || 'Nhân viên',
          hireDate: hireIso,
          status: matchDemoStatus(statusVal),
          department: { _id: matchedDept!._id, name: matchedDept!.name },
          createdAt: nowIso,
        });
      });

      if (errors.length > 0) {
        return new HttpResponse({
          status: 200,
          body: {
            success: false,
            message: 'Validation failed',
            total: rawRows.length,
            imported: 0,
            failed: errors.length,
            errors,
          },
        });
      }

      for (const emp of toCreate) {
        employees.unshift(emp);
        histories[emp._id] = [
          {
            _id: nextObjectId(),
            toDepartment: emp.department,
            transferDate: emp.hireDate,
          },
        ];
      }

      auditLogs.unshift({
        _id: nextObjectId(),
        userId: { _id: actor._id, username: actor.username },
        username: actor.username,
        action: 'IMPORT_EMPLOYEES',
        targetType: 'EMPLOYEE',
        targetId: toCreate[0]?._id ?? '',
        targetName: `Imported ${toCreate.length} ${toCreate.length === 1 ? 'employee' : 'employees'}`,
        details: {
          filename: file.name,
          count: toCreate.length,
          emails: toCreate.map((e) => e.email).join(', '),
        },
        createdAt: new Date().toISOString(),
      });

      return new HttpResponse({
        status: 200,
        body: {
          success: true,
          message: 'Import completed successfully',
          total: rawRows.length,
          imported: toCreate.length,
          failed: 0,
          errors: [],
        },
      });
    }),
  );
}

function handleDemoRequest(
  reqUrl: string,
  method: string,
  body: any,
  params: any,
): HttpResponse<any> | Observable<any> | null {
  if (!reqUrl.includes('/api/')) return null;
  const path = reqUrl.split('/api/')[1].split('?')[0];

  // 1. Auth login
  if (path === 'auth/login' && method === 'POST') {
    const username = (body?.username || 'admin').trim();
    const isStaff = username.toLowerCase() === 'user' || username.toLowerCase() === 'staff';
    const userObj = isStaff ? demoUsers[1] : demoUsers[0];
    return new HttpResponse({
      status: 200,
      body: {
        token: 'demo-jwt-token-preview',
        user: {
          id: userObj._id,
          username: username || userObj.username,
          role: userObj.role.name,
        },
      },
    });
  }

  // 2. Dashboard summary
  if (path === 'dashboard/summary' && method === 'GET') {
    const activeCount = employees.filter((e) => e.status === EmployeeStatus.ACTIVE).length;
    const byDept = depts.map((d) => {
      const count = employees.filter(
        (e) => e.department._id === d._id && e.status === EmployeeStatus.ACTIVE,
      ).length;
      return {
        departmentName: d.name,
        lastMonthCount: Math.max(0, count - 1),
        thisMonthCount: count > 0 ? 1 : 0,
        totalCount: count,
      };
    });
    return new HttpResponse({
      status: 200,
      body: {
        totalEmployees: employees.length,
        totalDepartments: depts.length,
        totalUsers: demoUsers.length,
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
        employeeCount: employees.filter((e) => e.department._id === d._id).length,
      }))
      .filter(
        (d) =>
          !search ||
          d.name.toLowerCase().includes(search) ||
          d.description.toLowerCase().includes(search),
      );
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
    const id = resolveId(path.split('/')[1]);
    const found = depts.find((d) => d._id === id) ?? depts[0];
    return new HttpResponse({ status: 200, body: found });
  }

  if (path === 'departments' && method === 'POST') {
    const actor = getCurrentDemoUser();
    const newDept: DemoDepartment = {
      _id: nextObjectId(),
      name: body?.name || 'New Department',
      description: body?.description || '',
      createdAt: new Date().toISOString(),
    };
    depts.unshift(newDept);
    auditLogs.unshift({
      _id: nextObjectId(),
      userId: { _id: actor._id, username: actor.username },
      username: actor.username,
      action: 'CREATE_DEPARTMENT',
      targetType: 'DEPARTMENT',
      targetId: newDept._id,
      targetName: newDept.name,
      details: { name: newDept.name, description: newDept.description },
      createdAt: new Date().toISOString(),
    });
    return new HttpResponse({ status: 201, body: newDept });
  }

  if (path.startsWith('departments/') && method === 'PUT') {
    const actor = getCurrentDemoUser();
    const id = resolveId(path.split('/')[1]);
    const idx = depts.findIndex((d) => d._id === id);
    if (idx !== -1) {
      const before = { ...depts[idx] };
      depts[idx] = { ...depts[idx], ...body };
      auditLogs.unshift({
        _id: nextObjectId(),
        userId: { _id: actor._id, username: actor.username },
        username: actor.username,
        action: 'UPDATE_DEPARTMENT',
        targetType: 'DEPARTMENT',
        targetId: id,
        targetName: depts[idx].name,
        details: {
          before: { name: before.name, description: before.description },
          after: { name: depts[idx].name, description: depts[idx].description },
        },
        createdAt: new Date().toISOString(),
      });
      return new HttpResponse({ status: 200, body: depts[idx] });
    }
  }

  if (path.startsWith('departments/') && method === 'DELETE') {
    const actor = getCurrentDemoUser();
    const id = resolveId(path.split('/')[1]);
    const empCount = employees.filter((e) => e.department._id === id).length;
    if (empCount > 0) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              message: `Department still has ${empCount} employee(s). Reassign them before deleting.`,
              employeeCount: empCount,
            },
          }),
      );
    }
    const idx = depts.findIndex((d) => d._id === id);
    if (idx !== -1) {
      const [removed] = depts.splice(idx, 1);
      auditLogs.unshift({
        _id: nextObjectId(),
        userId: { _id: actor._id, username: actor.username },
        username: actor.username,
        action: 'DELETE_DEPARTMENT',
        targetType: 'DEPARTMENT',
        targetId: removed._id,
        targetName: removed.name,
        details: { name: removed.name, description: removed.description },
        createdAt: new Date().toISOString(),
      });
      return new HttpResponse({ status: 204, body: null });
    }
  }

  // 4. Employees Import
  if (path === 'employees/import' && method === 'POST') {
    if (body instanceof FormData) {
      const file = body.get('file');
      if (file instanceof File) {
        return handleExcelImport(file);
      }
    }
    return throwError(
      () => new HttpErrorResponse({ status: 400, error: { message: 'No file uploaded' } }),
    );
  }

  // 5. Employees CRUD
  if (path === 'employees' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    const deptFilter = resolveId(params.get('department') || '');
    const statusFilter = params.get('status') || '';
    const sortField = params.get('sort') || 'createdAt';
    const sortOrder = params.get('order') === 'asc' ? 1 : -1;
    const page = Number(params.get('page') || 1);
    const limit = Number(params.get('limit') || 10);

    const filtered = employees
      .filter((e) => {
        const full1 = `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase();
        const full2 = `${e.lastName} ${e.firstName} ${e.email}`.toLowerCase();
        if (search && !full1.includes(search) && !full2.includes(search)) return false;
        if (deptFilter && e.department._id !== deptFilter) return false;
        if (statusFilter && e.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const va = String((a as unknown as Record<string, unknown>)[sortField] ?? '');
        const vb = String((b as unknown as Record<string, unknown>)[sortField] ?? '');
        return va.localeCompare(vb) * sortOrder;
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
    const id = resolveId(path.split('/')[1]);
    const emp = employees.find((e) => e._id === id) ?? employees[0];
    const list = histories[id] ?? [
      {
        _id: nextObjectId(),
        toDepartment: emp.department,
        transferDate: emp.hireDate || emp.createdAt,
      },
    ];
    return new HttpResponse({ status: 200, body: list });
  }

  if (path.startsWith('employees/') && method === 'GET') {
    const id = resolveId(path.split('/')[1]);
    const emp = employees.find((e) => e._id === id) ?? employees[0];
    return new HttpResponse({ status: 200, body: emp });
  }

  if (path === 'employees' && method === 'POST') {
    const actor = getCurrentDemoUser();
    const deptObj = depts.find((d) => d._id === body?.department) ?? depts[0];
    const nowIso = new Date().toISOString();
    const newEmp: DemoEmployee = {
      _id: nextObjectId(),
      firstName: body?.firstName || 'New',
      lastName: body?.lastName || 'Employee',
      email: body?.email || 'employee@company-demo.vn',
      phone: body?.phone || '0900112233',
      gender: body?.gender || 'MALE',
      dateOfBirth: body?.dateOfBirth || '1998-01-01',
      address: body?.address || 'Ho Chi Minh City',
      position: body?.position || 'Nhân viên',
      hireDate: body?.hireDate || nowIso.slice(0, 10),
      status: (body?.status as EmployeeStatus) || EmployeeStatus.ACTIVE,
      department: { _id: deptObj._id, name: deptObj.name },
      createdAt: nowIso,
    };
    employees.unshift(newEmp);
    histories[newEmp._id] = [
      {
        _id: nextObjectId(),
        toDepartment: newEmp.department,
        transferDate: newEmp.hireDate,
      },
    ];
    auditLogs.unshift({
      _id: nextObjectId(),
      userId: { _id: actor._id, username: actor.username },
      username: actor.username,
      action: 'CREATE_EMPLOYEE',
      targetType: 'EMPLOYEE',
      targetId: newEmp._id,
      targetName: `${newEmp.firstName} ${newEmp.lastName}`,
      details: {
        email: newEmp.email,
        position: newEmp.position,
        department: deptObj.name,
        status: newEmp.status,
      },
      createdAt: nowIso,
    });
    return new HttpResponse({ status: 201, body: newEmp });
  }

  if (path.startsWith('employees/') && method === 'PUT') {
    const actor = getCurrentDemoUser();
    const id = path.split('/')[1];
    const idx = employees.findIndex((e) => e._id === id);
    if (idx !== -1) {
      const prev = employees[idx];
      const nextDeptId =
        typeof body?.department === 'object'
          ? body.department._id
          : body?.department || prev.department._id;
      const nextDept = depts.find((d) => d._id === nextDeptId) ?? prev.department;
      const isTransfer = prev.department._id !== nextDept._id;
      const nowIso = new Date().toISOString();

      let deactivatedDate = prev.deactivatedDate ?? null;
      if (body?.status === EmployeeStatus.INACTIVE && prev.status !== EmployeeStatus.INACTIVE) {
        deactivatedDate = nowIso;
      } else if (body?.status === EmployeeStatus.ACTIVE) {
        deactivatedDate = null;
      }

      employees[idx] = {
        ...prev,
        ...body,
        deactivatedDate,
        department: { _id: nextDept._id, name: nextDept.name },
      };

      if (isTransfer) {
        histories[id] = histories[id] ?? [];
        histories[id].unshift({
          _id: nextObjectId(),
          fromDepartment: prev.department,
          toDepartment: { _id: nextDept._id, name: nextDept.name },
          transferDate: nowIso,
        });
      }

      auditLogs.unshift({
        _id: nextObjectId(),
        userId: { _id: actor._id, username: actor.username },
        username: actor.username,
        action: isTransfer ? 'TRANSFER_EMPLOYEE' : 'UPDATE_EMPLOYEE',
        targetType: 'EMPLOYEE',
        targetId: id,
        targetName: `${employees[idx].firstName} ${employees[idx].lastName}`,
        details: {
          before: {
            department: prev.department.name,
            position: prev.position,
            status: prev.status,
          },
          after: {
            department: nextDept.name,
            position: employees[idx].position,
            status: employees[idx].status,
          },
        },
        createdAt: nowIso,
      });

      return new HttpResponse({ status: 200, body: employees[idx] });
    }
  }

  if (path.startsWith('employees/') && method === 'DELETE') {
    const actor = getCurrentDemoUser();
    const id = path.split('/')[1];
    const idx = employees.findIndex((e) => e._id === id);
    if (idx !== -1) {
      const emp = employees[idx];
      if (emp.status === EmployeeStatus.ACTIVE) {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { message: 'Cannot delete active employee. Set status to Inactive first.' },
            }),
        );
      }
      employees.splice(idx, 1);
      auditLogs.unshift({
        _id: nextObjectId(),
        userId: { _id: actor._id, username: actor.username },
        username: actor.username,
        action: 'DELETE_EMPLOYEE',
        targetType: 'EMPLOYEE',
        targetId: emp._id,
        targetName: `${emp.firstName} ${emp.lastName}`,
        details: { email: emp.email, department: emp.department.name, position: emp.position },
        createdAt: new Date().toISOString(),
      });
      return new HttpResponse({ status: 204, body: null });
    }
  }

  // 6. Audit logs
  if (path === 'audit-logs/actions' && method === 'GET') {
    const uniqueActions = Array.from(new Set(auditLogs.map((l) => l.action)));
    return new HttpResponse({ status: 200, body: uniqueActions });
  }

  if (path === 'audit-logs/users' && method === 'GET') {
    return new HttpResponse({
      status: 200,
      body: demoUsers.map((u) => ({ _id: u._id, username: u.username })),
    });
  }

  if (path === 'audit-logs' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    const userId = params.get('userId') || '';
    const action = params.get('action') || '';
    const targetId = params.get('targetId') || '';
    const startDate = params.get('startDate') || '';
    const endDate = params.get('endDate') || '';
    const sortField = params.get('sort') || 'createdAt';
    const sortOrder = params.get('order') === 'asc' ? 1 : -1;
    const page = Number(params.get('page') || 1);
    const limit = Number(params.get('limit') || 7);

    const filtered = auditLogs
      .filter((l) => {
        if (userId && l.userId._id !== userId) return false;
        if (action && l.action !== action) return false;
        if (targetId && l.targetId !== targetId) return false;
        if (startDate && new Date(l.createdAt) < new Date(startDate)) return false;
        if (endDate && new Date(l.createdAt) > new Date(endDate)) return false;
        if (
          search &&
          !l.targetName.toLowerCase().includes(search) &&
          !l.username.toLowerCase().includes(search) &&
          !l.action.toLowerCase().includes(search)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const va = String((a as unknown as Record<string, unknown>)[sortField] ?? '');
        const vb = String((b as unknown as Record<string, unknown>)[sortField] ?? '');
        return va.localeCompare(vb) * sortOrder;
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

  // 7. Profile & Users
  if (path === 'profile' && method === 'GET') {
    const currentUser = getCurrentDemoUser();
    const emp = employees.find((e) => e._id === currentUser.employeeId) ?? employees[0];
    return new HttpResponse({
      status: 200,
      body: {
        _id: currentUser._id,
        username: currentUser.username,
        role: currentUser.role,
        employee: emp,
      },
    });
  }

  if (path === 'profile' && method === 'PUT') {
    const currentUser = getCurrentDemoUser();
    const emp = employees.find((e) => e._id === currentUser.employeeId);
    if (emp) {
      if (body?.phone !== undefined) emp.phone = body.phone;
      if (body?.address !== undefined) emp.address = body.address;
    }
    return new HttpResponse({ status: 200, body: { success: true } });
  }

  if (path === 'profile/change-password' && method === 'PUT') {
    return new HttpResponse({ status: 200, body: { success: true, message: 'Password updated' } });
  }

  if (path.startsWith('users/by-employee/') && method === 'GET') {
    const empId = path.split('/')[2];
    const found = demoUsers.find((u) => u.employeeId === empId);
    if (!found) {
      return throwError(
        () => new HttpErrorResponse({ status: 404, error: { message: 'User not found' } }),
      );
    }
    return new HttpResponse({
      status: 200,
      body: {
        _id: found._id,
        username: found.username,
        role: found.role,
      },
    });
  }

  if (path.startsWith('users/check-username') && method === 'GET') {
    const username = (params.get('username') || '').toLowerCase();
    const exists = demoUsers.some((u) => u.username.toLowerCase() === username);
    return new HttpResponse({ status: 200, body: { exists } });
  }

  if (path === 'users' && method === 'POST') {
    const roleName = body?.roleName === 'ADMIN' ? 'ADMIN' : 'USER';
    const newUser = {
      _id: nextObjectId(),
      username: body?.username || `user_${Date.now()}`,
      role: {
        _id: roleName === 'ADMIN' ? '668000000000000000000011' : '668000000000000000000012',
        name: roleName,
      },
      employeeId: body?.employeeId || '',
    };
    demoUsers.push(newUser);
    return new HttpResponse({ status: 201, body: { success: true } });
  }

  if (path.startsWith('users/') && method === 'PUT') {
    const userId = path.split('/')[1];
    const target = demoUsers.find((u) => u._id === userId);
    if (target) {
      if (body?.username) target.username = body.username;
      if (body?.roleName) {
        const roleName = body.roleName === 'ADMIN' ? 'ADMIN' : 'USER';
        target.role = {
          _id: roleName === 'ADMIN' ? '668000000000000000000011' : '668000000000000000000012',
          name: roleName,
        };
      }
      const actor = getCurrentDemoUser();
      const isPasswordChanged = Boolean(body?.newPassword);
      auditLogs.unshift({
        _id: nextObjectId(),
        userId: { _id: actor._id, username: actor.username },
        username: actor.username,
        action: isPasswordChanged ? 'CHANGE_PASSWORD_BY_ADMIN' : 'UPDATE_USER',
        targetType: 'USER',
        targetId: target._id,
        targetName: target.username,
        details: isPasswordChanged
          ? { message: `Admin reset password for user ${target.username}` }
          : { username: target.username, role: target.role.name },
        createdAt: new Date().toISOString(),
      });
    }
    return new HttpResponse({ status: 200, body: { success: true } });
  }

  return new HttpResponse({ status: 200, body: { success: true } });
}

let forceDemoMode = false;

export const demoBackendInterceptor: HttpInterceptorFn = (req, next): Observable<any> => {
  if (forceDemoMode && req.url.includes('/api/')) {
    const demoRes = handleDemoRequest(req.url, req.method, req.body, req.params);
    if (demoRes) {
      return demoRes instanceof Observable ? demoRes : of(demoRes);
    }
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (req.url.includes('/api/')) {
        forceDemoMode = true;
        const demoRes = handleDemoRequest(req.url, req.method, req.body, req.params);
        if (demoRes) {
          return demoRes instanceof Observable ? demoRes : of(demoRes);
        }
      }
      return throwError(() => err);
    }),
  );
};
