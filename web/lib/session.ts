// Generates or retrieves a session token from localStorage
// Returns { sessionToken, role } where role is 'traveler' | 'merchant'
export function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem('mh_session_token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('mh_session_token', token);
  }
  return token;
}

export type Role = 'traveler' | 'merchant';

export function getRole(): Role {
  if (typeof window === 'undefined') return 'traveler';
  return (localStorage.getItem('mh_role') as Role) ?? 'traveler';
}

export function setRole(role: Role): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mh_role', role);
}
