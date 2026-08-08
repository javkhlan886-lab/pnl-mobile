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
  pnlViewableUserIds?: string[];
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

export interface SignupInput {
  accountType: "individual" | "organization";
  companyName: string;
  registerNumber?: string;
  adminName: string;
  phone: string;
  email: string;
}

export interface SignupResponse {
  message: string;
  dev?: { token: string; otp: string };
}

export async function signup(input: SignupInput): Promise<SignupResponse> {
  return apiFetch<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function forgotPassword(email: string): Promise<{ message: string; dev?: { token: string; otp: string } }> {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, otp: string, newPassword: string): Promise<AuthUser> {
  const data = await apiFetch<LoginResponse>(`/auth/reset-password/${token}`, {
    method: "POST",
    body: JSON.stringify({ otp, newPassword }),
  });
  await setToken(data.token);
  return data.user;
}

export async function logout(): Promise<void> {
  await clearToken();
}
