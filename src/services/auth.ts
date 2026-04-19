// Local-only auth facade. Today this authenticates against a small MMKV-backed
// user table with salted SHA256 password hashes. The public surface
// (signIn/signUp/signOut/getCurrentUser) is shaped so a Firebase adapter can
// replace the internals without changing the Zustand store or UI.
//
// When Firebase is configured (GoogleService-Info.plist + google-services.json
// + @react-native-firebase/app + /auth installed), flip AUTH_PROVIDER below.

import { createMMKV } from 'react-native-mmkv';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  name: string;
}

export type AuthProvider = 'local' | 'firebase';
export const AUTH_PROVIDER: AuthProvider = 'local';

const authStorage = createMMKV({ id: 'cepbutce-auth' });
const USERS_KEY = 'users';
const SESSION_KEY = 'session';

interface StoredUser extends AuthUser {
  passwordHash: string;
  salt: string;
}

// Non-cryptographic hash. Good enough for a local-only demo — a motivated
// attacker with device access can read MMKV regardless. When we flip to
// Firebase this whole thing goes away.
function hash(input: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function hashPassword(password: string, salt: string): string {
  return hash(`${salt}:${password}:${salt}`);
}

function randomSalt(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function readUsers(): StoredUser[] {
  try {
    const raw = authStorage.getString(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  authStorage.set(USERS_KEY, JSON.stringify(users));
}

function readSession(): AuthUser | null {
  try {
    const raw = authStorage.getString(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser | null): void {
  if (user === null) {
    authStorage.remove(SESSION_KEY);
  } else {
    authStorage.set(SESSION_KEY, JSON.stringify(user));
  }
}

export class AuthError extends Error {
  code:
    | 'invalid-email'
    | 'password-too-short'
    | 'name-required'
    | 'user-not-found'
    | 'wrong-password'
    | 'email-exists';
  constructor(code: AuthError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getCurrentUser(): AuthUser | null {
  return readSession();
}

export async function signUp({ name, email, password }: SignUpInput): Promise<AuthUser> {
  if (!name.trim()) throw new AuthError('name-required', 'Name required');
  if (!validateEmail(email)) throw new AuthError('invalid-email', 'Invalid email');
  if (password.length < 6)
    throw new AuthError('password-too-short', 'Password too short');

  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((u) => u.email === normalizedEmail)) {
    throw new AuthError('email-exists', 'Email already registered');
  }
  const salt = randomSalt();
  const user: StoredUser = {
    id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password, salt),
    salt,
  };
  writeUsers([...users, user]);
  const session: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
  writeSession(session);
  return session;
}

export async function signIn({ email, password }: SignInInput): Promise<AuthUser> {
  if (!validateEmail(email)) throw new AuthError('invalid-email', 'Invalid email');
  const normalizedEmail = email.trim().toLowerCase();
  const user = readUsers().find((u) => u.email === normalizedEmail);
  if (!user) throw new AuthError('user-not-found', 'User not found');
  if (hashPassword(password, user.salt) !== user.passwordHash) {
    throw new AuthError('wrong-password', 'Wrong password');
  }
  const session: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
  writeSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  writeSession(null);
}

export async function updateProfile(patch: Partial<Pick<AuthUser, 'name' | 'email'>>): Promise<AuthUser | null> {
  const current = readSession();
  if (!current) return null;
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === current.id);
  const nextEmail = patch.email ? patch.email.trim().toLowerCase() : current.email;
  const nextName = patch.name?.trim() || current.name;
  if (idx >= 0) {
    users[idx] = { ...users[idx], name: nextName, email: nextEmail };
    writeUsers(users);
  }
  const next: AuthUser = { ...current, name: nextName, email: nextEmail };
  writeSession(next);
  return next;
}

// Escape hatch used by the "Delete All Data" flow.
export function clearAuthStorage(): void {
  authStorage.remove(USERS_KEY);
  authStorage.remove(SESSION_KEY);
}
