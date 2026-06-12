import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readYtStreams, writeYtStreams, type YtStream } from '@/lib/feeds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  return NextResponse.json(await readYtStreams());
}

export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const body = await req.json() as { streams?: YtStream[] };
  if (!Array.isArray(body.streams)) return NextResponse.json({ error: 'streams array required' }, { status: 400 });
  await writeYtStreams(body.streams);
  return NextResponse.json({ ok: true, count: body.streams.length });
}
