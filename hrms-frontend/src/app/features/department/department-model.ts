export interface Department {
  _id?: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentPaginatedResponse {
  data: Department[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
