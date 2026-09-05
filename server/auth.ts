import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { db } from './db.ts';
import { createSessionToken, hashSessionToken } from './security.ts';

export type UserRole = 'user' | 'admin';

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  role: UserRole;
  is_active: number;
  last_activity: string | null;
  created_at: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedUser;
}

const SESSION_COOKIE = 'network_ctf_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function readCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
}

export function createSession(userId: number): string {
  const token = createSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  db.prepare(`
    INSERT INTO auth_sessions (user_id, token_hash, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, hashSessionToken(token), now.toISOString(), expiresAt.toISOString());

  return token;
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });
}

export function destroySession(req: Request, res: Response): void {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) {
    db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashSessionToken(token));
  }

  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function getSessionUserFromRequest(req: Request): AuthenticatedUser | null {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;

  const session = db.prepare(`
    SELECT
      u.id, u.username, u.email, u.level, u.xp, u.coins, u.streak,
      u.role, u.is_active, u.last_activity, u.created_at, s.expires_at
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(hashSessionToken(token)) as unknown as (AuthenticatedUser & { expires_at: string }) | undefined;

  if (!session) return null;
  if (session.is_active !== 1 || Date.parse(session.expires_at) <= Date.now()) {
    db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashSessionToken(token));
    return null;
  }

  const { expires_at: _expiresAt, ...user } = session;
  return user;
}

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = getSessionUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const lastActivity = new Date().toISOString();
  db.prepare('UPDATE users SET last_activity = ? WHERE id = ?').run(lastActivity, user.id);
  user.last_activity = lastActivity;
  (req as AuthenticatedRequest).authUser = user;
  next();
};

export const requireAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).authUser;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

export function getAuthenticatedUser(req: Request): AuthenticatedUser {
  const user = (req as AuthenticatedRequest).authUser;
  if (!user) throw new Error('Authenticated user is unavailable');
  return user;
}
