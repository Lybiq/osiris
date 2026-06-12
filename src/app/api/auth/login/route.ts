import { NextResponse } from 'next/server';
import {
  bootstrapAdmin,
  readUsers,
  writeUsers,
  verifyPassword,
  isLegacyHash,
  hashPassword,
  jwtSign,
  clientIP,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  await bootstrapAdmin();

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const username = (body.username || '').trim();
  const password = body.password || '';
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const users = await readUsers();
  const u = users[username];
  if (!u || !u.hash || !verifyPassword(password, u.hash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const role = u.role || 'user';
  const token = await jwtSign({
    username,
    role,
    exp: Math.floor(Date.now() / 1000) + 30 * 86400,
  });

  // Transparently upgrade legacy bcrypt hashes to scrypt on successful login.
  const upgradedHash = isLegacyHash(u.hash) ? hashPassword(password) : u.hash;

  users[username] = {
    ...u,
    hash: upgradedHash,
    role,
    lastLogin: new Date().toISOString(),
    lastIP: clientIP(req),
    lastUA: req.headers.get('user-agent') || '',
    lastLoc: u.lastLoc ?? null,
  };
  await writeUsers(users);

  return NextResponse.json({ token, username, role });
}
