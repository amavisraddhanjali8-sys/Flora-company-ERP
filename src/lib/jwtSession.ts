import { UserProfile } from '../types';

/**
 * Creates a client-side JWT session token for user authentication.
 */
export function createJwtSessionToken(user: UserProfile): string {
  try {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        status: user.status,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000) // Valid for 7 days
      })
    );
    const signature = btoa(`sig_${user.id}_${Date.now()}`).substring(0, 16);
    return `${header}.${payload}.${signature}`;
  } catch (err) {
    return `session_${user.id}_${Date.now()}`;
  }
}

/**
 * Validates and parses a client-side JWT session token.
 */
export function parseJwtSessionToken(token: string): { sub: string; email: string; role: string; exp: number } | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = atob(parts[1]);
    const payload = JSON.parse(payloadJson);
    
    if (!payload.sub || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null; // Token expired

    return payload;
  } catch (err) {
    return null;
  }
}
