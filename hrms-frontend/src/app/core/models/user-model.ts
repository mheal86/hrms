export interface CreateUserPayload {
  username: string;
  password: string;
  roleName: string;
  employeeId: string;
}

export interface UserAccountData {
  _id: string;
  username: string;
  role: { _id: string; name: string };
}

export interface UpdateUserPayload {
  username?: string;
  roleName?: string;
  newPassword?: string;
}
