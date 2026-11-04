export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  job_role: string | null;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  full_name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  job_role?: string | null;
  status?: "Active" | "Inactive";
}

export interface UpdateUserInput {
  full_name?: string;
  email?: string;
  phone?: string | null;
  department?: string | null;
  job_role?: string | null;
  status?: "Active" | "Inactive";
}

export interface UserQueryParams {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DepartmentCount {
  department: string;
  count: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentlyAddedUsers: number;
  departments: DepartmentCount[];
  recentUsers: User[];
}

