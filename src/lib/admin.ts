import { apiFetch } from "./api";
import type { AuthUser } from "./auth";

export const getCompanyUsers = (companyId: string) =>
  apiFetch<{ users: AuthUser[] }>(`/companies/${companyId}/users`).then((r) => r.users);

export const changePnlLevel = (userId: string, level: 1 | 2 | 3 | 4, viewableUserIds?: string[]) =>
  apiFetch<{ user: AuthUser }>(`/users/${userId}/pnl-level`, {
    method: "PATCH",
    body: JSON.stringify({ level, viewableUserIds }),
  }).then((r) => r.user);
