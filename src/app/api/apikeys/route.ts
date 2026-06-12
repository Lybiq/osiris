import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { KEY_DEFS, readKeys, writeKeys, applyToEnv, maskKey, type KeyStore } from '@/lib/apikeys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/apikeys — definitions + whether each is set + masked preview (admin)
export async function GET(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const stored = await readKeys();
  const keys = KEY_DEFS.map(def => {
    const val = stored[def.env] || '';
    // env-only value (set via .env, not via UI) still counts as "set"
    const envVal = process.env[def.env] || '';
    const effective = val || envVal;
    return {
      env: def.env,
      label: def.label,
      hint: def.hint,
      secret: def.secret ?? true,
      section: def.section,
      registerUrl: def.registerUrl || null,
      pair: def.pairWith || null,
      hidden: def.hidden || false,
      set: !!effective,
      preview: effective ? maskKey(effective) : '',
      fromEnv: !val && !!envVal,
    };
  });
  return NextResponse.json(keys);
}

// POST /api/apikeys — save changed keys (admin)
// Body: { values: { ENV_NAME: "newvalue", ... } }  empty string = clear
export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  let body: { values?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const incoming = body.values || {};
  const known = new Set(KEY_DEFS.map(k => k.env));

  const stored: KeyStore = await readKeys();
  for (const [k, v] of Object.entries(incoming)) {
    if (!known.has(k)) continue;
    if (typeof v !== 'string') continue;
    if (v.trim() === '') {
      delete stored[k]; // clear
    } else {
      stored[k] = v.trim();
    }
  }
  await writeKeys(stored);
  applyToEnv(stored); // take effect immediately for new requests
  return NextResponse.json({ ok: true });
}
