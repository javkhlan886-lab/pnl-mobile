import { apiFetch, setToken, clearToken } from "./api";

export interface AuthUser {
  id: string;
  companyId: string | null;
  role: "super_admin" | "company_admin" | "company_user";
  name: string;
  phone: string;
  email: string;
  status: "pending" | "active" | "suspended";
  pnlLevel?: number;
}

export interface AuthCompany {
  id: string;
  name: string;
  status: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  await setToken(data.token);
  return data.user;
}

export async function fetchMe(): Promise<{ user: AuthUser; company: AuthCompany | null }> {
  return apiFetch("/auth/me");
}

export async function logout(): Promise<void> {
  await clearToken();
}
