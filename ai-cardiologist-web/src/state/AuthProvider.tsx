import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setApiTokenGetter } from '../lib/apiClient';
import { mapRoleToPermissions, type AppRole, type Permission } from '../lib/permissions';

export type AuthUser = {
  name: string;
  email: string;
  provider?: 'google' | 'github' | 'apple' | 'linkedin';
};

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole>('individual');
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

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
    setIsAuthenticated(true);
    setUser(input.user);
    setRole(input.role);
    setToken(input.token);
    setTenantId(input.tenantId);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRole('individual');
    setToken(null);
    setTenantId(null);
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
