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
  status?: string;
  deactivatedDate?: string;
  department: string | { _id: string; name: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}