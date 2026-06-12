import { NextResponse } from 'next/server';
import {
  requireAuth,
  readUsers,
  writeUsers,
  hashPassword,
  USERNAME_RE,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// DELETE /api/users/:username (admin only)
export async function DELETE(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { username: target } = await ctx.params;
  if (target === user.username)
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

  const users = await readUsers();
  if (!users[target]) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  delete users[target];
  await writeUsers(users);
  return NextResponse.json({ ok: true });
}

// PATCH /api/users/:username — change password (self or admin), role/rename (admin)
export async function PATCH(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let { username: target } = await ctx.params;
  if (target !== user.username && user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { password?: string; role?: string; newUsername?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const users = await readUsers();
  if (!users[target]) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (body.password !== undefined) {
    if (body.password.length < 4)
      return NextResponse.json({ error: 'Password too short (min 4)' }, { status: 400 });
    users[target].hash = hashPassword(body.password);
  }

  if (body.role !== undefined && user.role === 'admin') {
    if (body.role !== 'admin' && body.role !== 'user')
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    users[target].role = body.role;
  }

  if (body.newUsername !== undefined && user.role === 'admin') {
    const newName = body.newUsername.trim();
    if (newName !== '' && newName !== target) {
      if (!USERNAME_RE.test(newName))
        return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
      if (users[newName]) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      users[newName] = users[target];
      delete users[target];
      target = newName;
    }
  }

  await writeUsers(users);
  return NextResponse.json({ ok: true, username: target });
}
