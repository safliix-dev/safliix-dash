import { type PaginatedResponse } from "./common";

export type AdminStatus = "active" | "inactive" | "suspended" | string;
export type AdminRole = "admin" | "editor" | "viewer" | string;

export interface AdminListParams extends Record<string,unknown> {
  page: number;
  pageSize: number;
  search?: string;
  status?: AdminStatus;
  role?: AdminRole;
}

export interface AdminListItem {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  status: AdminStatus;
  role?: AdminRole;
  avatar?: string;
  createdAt?: string;
}

export type AdminListResponse = PaginatedResponse<AdminListItem>;

export interface AdminProfile extends AdminListItem {
  activity?: unknown[];
  subscriptions?: unknown[];
  transactions?: unknown[];
}

export interface AdminUpdatePayload {
  status?: AdminStatus;
  role?: AdminRole;
  profile?: Record<string, unknown>;
}

export type AdminFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "ADMIN" | "SUPER_ADMIN";
  status: "actif" | "inactif";
  country: string;
  city: string;
  state:string;
  address:string;
  password:string;
  confirmPassword:string;
};

export type AdminUpdateFormState = Partial<AdminFormState>;
