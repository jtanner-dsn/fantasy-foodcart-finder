'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getOrCreateSessionToken,
  getRole,
  setRole as persistRole,
  type Role,
} from '@/lib/session';

interface RoleContextValue {
  role: Role;
  sessionToken: string;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: 'traveler',
  sessionToken: '',
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('traveler');
  const [sessionToken, setSessionToken] = useState<string>('');

  // Initialise from localStorage on the client.
  useEffect(() => {
    setRoleState(getRole());
    setSessionToken(getOrCreateSessionToken());
  }, []);

  const setRole = useCallback((newRole: Role) => {
    persistRole(newRole);
    setRoleState(newRole);
  }, []);

  return (
    <RoleContext.Provider value={{ role, sessionToken, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  return useContext(RoleContext);
}
