import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 });
  }
  return NextResponse.json({ username: user.username, role: user.role });
}
