import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken } from "@/lib/api";
import { fetchMe, login as loginRequest, logout as logoutRequest, type AuthUser, type AuthCompany } from "@/lib/auth";

interface AuthState {
  user: AuthUser | null;
  company: AuthCompany | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<AuthCompany | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setCompany(null);
      setLoading(false);
      return;
    }
    try {
      const { user, company } = await fetchMe();
      setUser(user);
      setCompany(company);
    } catch {
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password);
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setCompany(null);
  }, []);

  const isAdmin = user?.role === "company_admin" || user?.role === "super_admin";

  return (
    <AuthContext.Provider value={{ user, company, loading, isAdmin, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
