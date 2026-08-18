import { BaseEntity } from './base-model';
export type { PaginatedResponse } from './pagination-model';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Employee extends BaseEntity {
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

export interface EmployeeHistory extends BaseEntity {
  fromDepartment?: { _id: string; name: string };
  toDepartment: { _id: string; name: string };
  transferDate: string;
}
