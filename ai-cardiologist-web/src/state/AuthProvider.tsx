import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setApiTokenGetter } from '../lib/apiClient';
import { clearAuthSession, loadAuthSession, saveAuthSession, type AuthUser } from '../lib/authStorage';
import { mapRoleToPermissions, type AppRole, type Permission } from '../lib/permissions';

export type { AuthUser };

interface AuthContextType {
  isAuthenticated: boolean;
  establishSession: (input: {
    user: AuthUser;
    role: AppRole;
    token: string;
    tenantId: string;
  }) => void;
  logout: () => void;
  user: AuthUser | null;
  role: AppRole;
  permissions: Permission[];
  token: string | null;
  tenantId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sessionFromStorage() {
  const stored = loadAuthSession();
  if (!stored) {
    return {
      isAuthenticated: false,
      user: null as AuthUser | null,
      role: 'individual' as AppRole,
      token: null as string | null,
      tenantId: null as string | null,
    };
  }
  return {
    isAuthenticated: true,
    user: stored.user,
    role: stored.role,
    token: stored.token,
    tenantId: stored.tenantId,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initial = sessionFromStorage();
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated);
  const [user, setUser] = useState<AuthUser | null>(initial.user);
  const [role, setRole] = useState<AppRole>(initial.role);
  const [token, setToken] = useState<string | null>(initial.token);
  const [tenantId, setTenantId] = useState<string | null>(initial.tenantId);

  const permissions = useMemo(() => mapRoleToPermissions(role), [role]);

  useEffect(() => {
    setApiTokenGetter(() => token);
  }, [token]);

  const establishSession = (input: {
    user: AuthUser;
    role: AppRole;
    token: string;
    tenantId: string;
  }) => {
    saveAuthSession(input);
    setIsAuthenticated(true);
    setUser(input.user);
    setRole(input.role);
    setToken(input.token);
    setTenantId(input.tenantId);
    setApiTokenGetter(() => input.token);
  };

  const logout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setUser(null);
    setRole('individual');
    setToken(null);
    setTenantId(null);
    setApiTokenGetter(() => null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, establishSession, logout, user, role, permissions, token, tenantId }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
