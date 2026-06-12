import { NextResponse } from 'next/server';
import {
  requireAuth,
  readUsers,
  writeUsers,
  hashPassword,
  USERNAME_RE,
  type Role,
  type UserStore,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── IP → Standort (Geo) mit kleinem In-Memory-Cache ────
const geoCache = new Map<string, string>();

function isPrivateIP(ip: string): boolean {
  return (
    ip === 'unknown' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^fe80:/i.test(ip) ||
    /^fc00:/i.test(ip)
  );
}

async function resolveLocation(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  if (isPrivateIP(ip)) return 'LAN / Lokal';
  if (geoCache.has(ip)) return geoCache.get(ip)!;
  try {
    const ctrl = AbortSignal.timeout(2500);
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,country`, { signal: ctrl });
    const d = await res.json();
    if (d && d.success) {
      const loc = [d.city, d.country].filter(Boolean).join(', ') || null;
      if (loc) geoCache.set(ip, loc);
      return loc;
    }
  } catch {
    /* geo lookup is best-effort */
  }
  return null;
}

// GET /api/users — list all (admin only)
export async function GET(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const users = await readUsers();
  const list = await Promise.all(
    Object.entries(users).map(async ([username, u]) => ({
      username,
      role: u.role || 'user',
      lastLogin: u.lastLogin ?? null,
      lastIP: u.lastIP ?? null,
      lastLoc: u.lastLoc ?? (await resolveLocation(u.lastIP)),
      lastUA: u.lastUA ?? null,
      created: u.created ?? null,
    })),
  );
  return NextResponse.json(list);
}

// POST /api/users — create (admin only)
export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  let body: { username?: string; password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const username = (body.username || '').trim();
  const password = body.password || '';
  const role: Role = body.role === 'admin' ? 'admin' : 'user';

  if (!username || !password)
    return NextResponse.json({ error: 'username and password required' }, { status: 400 });
  if (!USERNAME_RE.test(username))
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });

  const users: UserStore = await readUsers();
  if (users[username]) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

  users[username] = {
    hash: hashPassword(password),
    role,
    created: new Date().toISOString(),
    lastLogin: null,
    lastIP: null,
    lastLoc: null,
    lastUA: null,
  };
  await writeUsers(users);
  return NextResponse.json({ ok: true });
}
