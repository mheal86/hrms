import { BaseDocument } from './base-model';

export interface CreateUserPayload {
  username: string;
  password: string;
  roleName: string;
  employeeId: string;
}

export interface UserAccountData extends BaseDocument {
  username: string;
  role: { _id: string; name: string };
}

export interface UpdateUserPayload {
  username?: string;
  roleName?: string;
  newPassword?: string;
}
