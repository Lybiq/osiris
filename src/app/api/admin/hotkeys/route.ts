import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readHotkeys, writeHotkeys, getMergedHotkeys, type HotkeyStore } from '@/lib/hotkeys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const overrides = await readHotkeys();
  return NextResponse.json(getMergedHotkeys(overrides));
}

export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const { hotkeys } = await req.json() as { hotkeys?: HotkeyStore };
  if (!hotkeys || typeof hotkeys !== 'object') return NextResponse.json({ error: 'hotkeys object required' }, { status: 400 });
  await writeHotkeys(hotkeys);
  return NextResponse.json({ ok: true });
}
