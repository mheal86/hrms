export type { PaginatedResponse } from './pagination-model';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Employee {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  position?: string;
  hireDate?: string;
  avatarUrl?: string;
  status?: EmployeeStatus;
  deactivatedDate?: string;
  department: string | { _id: string; name: string };
}

export interface EmployeeHistory {
  _id?: string;
  fromDepartment?: { _id: string; name: string };
  toDepartment: { _id: string; name: string };
  transferDate: string;
}
