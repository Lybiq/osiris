import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readKeys } from '@/lib/apikeys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TestResult {
  env: string;
  label: string;
  status: 'ok' | 'fail' | 'skip' | 'auth';
  message: string;
  ms?: number;
}

async function testKey(env: string, value: string): Promise<Omit<TestResult, 'env' | 'label'>> {
  if (!value) return { status: 'skip', message: 'Nicht konfiguriert' };
  const t0 = Date.now();
  try {
    switch (env) {
      case 'FIRMS_API_KEY': {
        const r = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${value}/VIIRS_SNPP_NRT/world/1/2024-01-01`, { signal: AbortSignal.timeout(8000) });
        return r.ok ? { status: 'ok', message: `HTTP ${r.status}`, ms: Date.now() - t0 } : { status: r.status === 401 || r.status === 403 ? 'auth' : 'fail', message: `HTTP ${r.status}`, ms: Date.now() - t0 };
      }
      case 'N2YO_API_KEY': {
        const r = await fetch(`https://api.n2yo.com/rest/v1/satellite/tle/25544&apiKey=${value}`, { signal: AbortSignal.timeout(8000) });
        const d = await r.json().catch(() => ({}));
        if (d.error || d.data === 'api_key_expired' || d.data === 'incorrect_api_key') return { status: 'auth', message: d.error || d.data || 'Auth failed', ms: Date.now() - t0 };
        return { status: 'ok', message: 'ISS TLE OK', ms: Date.now() - t0 };
      }
      case 'AIS_API_KEY': {
        // AISstream is WebSocket — just validate it's a reasonable key format
        return value.length >= 20 ? { status: 'ok', message: `Key-Format OK (${value.length} Zeichen)`, ms: 0 } : { status: 'fail', message: 'Key zu kurz' };
      }
      case 'OPENWEATHER_KEY': {
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Berlin&appid=${value}`, { signal: AbortSignal.timeout(8000) });
        return r.ok ? { status: 'ok', message: 'Berlin weather OK', ms: Date.now() - t0 } : { status: r.status === 401 ? 'auth' : 'fail', message: `HTTP ${r.status}`, ms: Date.now() - t0 };
      }
      case 'GEMINI_API_KEY_1': {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${value}`, { signal: AbortSignal.timeout(8000) });
        return r.ok ? { status: 'ok', message: 'Models list OK', ms: Date.now() - t0 } : { status: r.status === 400 || r.status === 403 ? 'auth' : 'fail', message: `HTTP ${r.status}`, ms: Date.now() - t0 };
      }
      default:
        // Generic: just check if it's a non-empty string
        return { status: 'ok', message: `Gesetzt (${value.length} Zeichen)`, ms: 0 };
    }
  } catch (e) {
    return { status: 'fail', message: (e as Error).message?.slice(0, 80) || 'Error', ms: Date.now() - t0 };
  }
}

const LABELS: Record<string, string> = {
  GEMINI_API_KEY_1: 'Gemini', FIRMS_API_KEY: 'NASA FIRMS', AIS_API_KEY: 'AISstream',
  N2YO_API_KEY: 'N2YO', OPENWEATHER_KEY: 'OpenWeather', OPENSKY_CLIENT_ID: 'OpenSky',
  ADSB_API_KEY: 'ADSB Exchange', FR24_API_KEY: 'FlightRadar24',
  MARINETRAFFIC_KEY: 'MarineTraffic', VESSELTRACKER_KEY: 'VesselTracker',
  VESSELFINDER_KEY: 'VesselFinder', STORMGLASS_KEY: 'StormGlass', IQAIR_KEY: 'IQAir',
  AMBEE_KEY: 'Ambee', GDACS_KEY: 'GDACS', TRANSITLAND_KEY: 'Transitland',
  MAPTILER_KEY: 'MapTiler', THUNDERFOREST_KEY: 'Thunderforest', GOOGLE_PLACES_KEY: 'Google Places',
};

// POST /api/apikeys/test — test all configured keys
export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const stored = await readKeys();
  const envKeys = { ...stored };
  // Also pick up env-var-only keys
  for (const env of Object.keys(LABELS)) {
    if (!envKeys[env] && process.env[env]) envKeys[env] = process.env[env]!;
  }

  const results: TestResult[] = [];
  for (const [env, label] of Object.entries(LABELS)) {
    const value = envKeys[env] || '';
    const r = await testKey(env, value);
    results.push({ env, label, ...r });
  }

  return NextResponse.json(results);
}
