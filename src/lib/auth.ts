// ═══════════════════════════════════════════════════════
//  OSINT — Auth core (ported from legacy PHP api.php)
//  Dependency-free: Node crypto for JWT (HS256) + scrypt hashing.
//  File-based user store under OSIRIS_DATA_DIR (default ./data).
// ═══════════════════════════════════════════════════════
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export type Role = 'admin' | 'user';

export interface UserRecord {
  hash: string;
  role: Role;
  created: string;
  lastLogin: string | null;
  lastIP: string | null;
  lastLoc: string | null;
  lastUA: string | null;
}
export type UserStore = Record<string, UserRecord>;

export interface JwtPayload {
  username: string;
  role: Role;
  exp: number;
}

// ── Paths ──────────────────────────────────────────────
const DATA_DIR = process.env.OSIRIS_DATA_DIR || path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// ── JWT secret ─────────────────────────────────────────
let cachedSecret: string | null = null;
async function getSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  if (process.env.OSIRIS_JWT_SECRET) {
    cachedSecret = process.env.OSIRIS_JWT_SECRET;
    return cachedSecret;
  }
  await ensureDataDir();
  try {
    cachedSecret = (await fs.readFile(SECRET_FILE, 'utf-8')).trim();
  } catch {
    cachedSecret = crypto.randomBytes(48).toString('hex');
    await fs.writeFile(SECRET_FILE, cachedSecret, { mode: 0o600 });
  }
  return cachedSecret;
}

// ── Password hashing (scrypt) ──────────────────────────
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  // Legacy bcrypt hashes from the old PHP backend ($2a$ / $2b$ / $2y$).
  // PHP emits the $2y$ variant; bcryptjs only recognises $2a$/$2b$, so we
  // normalise the version flag — the underlying KDF is identical, this is safe.
  if (isLegacyHash(stored)) {
    try {
      const normalised = stored.replace(/^\$2y\$/, '$2b$');
      return bcrypt.compareSync(password, normalised);
    } catch {
      return false;
    }
  }

  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const derived = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** True for old bcrypt hashes ($2a$/$2b$/$2y$) that should be upgraded to scrypt. */
export function isLegacyHash(stored: string): boolean {
  return /^\$2[aby]\$/.test(stored);
}

// ── JWT (HS256) ────────────────────────────────────────
function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export async function jwtSign(payload: JwtPayload): Promise<string> {
  const secret = await getSecret();
  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export async function jwtVerify(token: string): Promise<JwtPayload | null> {
  const secret = await getSecret();
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = b64url(crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as JwtPayload;
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

// ── User store ─────────────────────────────────────────
export async function readUsers(): Promise<UserStore> {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf-8');
    return (JSON.parse(raw) as UserStore) || {};
  } catch {
    return {};
  }
}

export async function writeUsers(users: UserStore): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

/** Bootstrap a default admin (admin/admin) on first run — change immediately. */
export async function bootstrapAdmin(): Promise<UserStore> {
  const users = await readUsers();
  if (Object.keys(users).length === 0) {
    const seed: UserStore = {
      admin: {
        hash: hashPassword(process.env.OSIRIS_ADMIN_PASSWORD || 'admin'),
        role: 'admin',
        created: new Date().toISOString(),
        lastLogin: null,
        lastIP: null,
        lastLoc: null,
        lastUA: null,
      },
    };
    await writeUsers(seed);
    return seed;
  }
  return users;
}

// ── Request auth helpers ───────────────────────────────
export function getBearerToken(req: Request): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (!h.startsWith('Bearer ')) return null;
  return h.slice(7);
}

export async function requireAuth(req: Request): Promise<JwtPayload | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  return jwtVerify(token);
}

export function clientIP(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'
  );
}

export const USERNAME_RE = /^[a-zA-Z0-9_\-.]{1,32}$/;
