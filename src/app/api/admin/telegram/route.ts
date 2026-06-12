import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readTelegramFeeds, writeTelegramFeeds, type TelegramFeed } from '@/lib/feeds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  return NextResponse.json(await readTelegramFeeds());
}

export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const body = await req.json() as { feeds?: TelegramFeed[] };
  if (!Array.isArray(body.feeds)) return NextResponse.json({ error: 'feeds array required' }, { status: 400 });
  await writeTelegramFeeds(body.feeds);
  return NextResponse.json({ ok: true, count: body.feeds.length });
}
