import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readCustomCameras, writeCustomCameras, type CustomCamera } from '@/lib/feeds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  return NextResponse.json(await readCustomCameras());
}

export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const body = await req.json() as { cameras?: CustomCamera[] };
  if (!Array.isArray(body.cameras)) return NextResponse.json({ error: 'cameras array required' }, { status: 400 });
  await writeCustomCameras(body.cameras);
  return NextResponse.json({ ok: true, count: body.cameras.length });
}
