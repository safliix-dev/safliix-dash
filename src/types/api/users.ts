import { type PaginatedResponse } from "./common";

export type UserStatus = "active" | "inactive" | "suspended" | string;
export type UserRole = "admin" | "editor" | "viewer" | string;

export interface UserListParams extends Record<string,unknown> {
  page: number;
  pageSize: number;
  search?: string;
  status?: UserStatus;
  role?: UserRole;
}

export interface UserPayload {
  firstName: string;
  lastName:string;
  email: string;
  phone?: string;
  status: UserStatus;
  role: UserRole;
  avatarUrl?: string;
  password:string;
  confirmPassword:string;
}


export interface UserListItem {
  id: string;
  firstName: string;
  lastName:string;
  email: string;
  phone?: string;
  status: UserStatus;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export type UserListResponse = PaginatedResponse<UserListItem>;

export interface UserProfile extends UserListItem {
  activity?: unknown[];
  subscriptions?: unknown[];
  transactions?: unknown[];
}

export interface UserUpdatePayload {
  status?: UserStatus;
  role?: UserRole;
  profile?: Record<string, unknown>;
}
