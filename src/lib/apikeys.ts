// ═══════════════════════════════════════════════════════
//  OSINT — Server API-Key store
//  Persisted in OSINT_DATA_DIR/apikeys.json. Applied to
//  process.env at startup (instrumentation) and on save, so
//  existing routes that read process.env.X pick them up
//  without needing per-route changes.
// ═══════════════════════════════════════════════════════
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.OSIRIS_DATA_DIR || path.join(process.cwd(), 'data');
const KEYS_FILE = path.join(DATA_DIR, 'apikeys.json');

export interface KeyDef {
  env: string;
  label: string;
  hint: string;
  secret?: boolean;
}

// The server-side keys exposed in the Admin → API Keys panel.
export const KEY_DEFS: KeyDef[] = [
  { env: 'GEMINI_API_KEY_1', label: 'Gemini API Key', hint: 'KI-Analyse — aistudio.google.com/apikey', secret: true },
  { env: 'FIRMS_API_KEY', label: 'NASA FIRMS', hint: 'Aktive Brände — firms.modaps.eosdis.nasa.gov', secret: true },
  { env: 'AIS_API_KEY', label: 'AISstream', hint: 'Schiffsverkehr — aisstream.io', secret: true },
  { env: 'OPENSKY_CLIENT_ID', label: 'OpenSky Client ID', hint: 'Flugverkehr (höheres Limit)', secret: false },
  { env: 'OPENSKY_CLIENT_SECRET', label: 'OpenSky Client Secret', hint: 'OpenSky OAuth2', secret: true },
  { env: 'N2YO_API_KEY', label: 'N2YO', hint: 'Satelliten-Tracking — n2yo.com', secret: true },
];

const KNOWN_ENVS = new Set(KEY_DEFS.map(k => k.env));

export type KeyStore = Record<string, string>;

export async function readKeys(): Promise<KeyStore> {
  try {
    const raw = await fs.readFile(KEYS_FILE, 'utf-8');
    return (JSON.parse(raw) as KeyStore) || {};
  } catch {
    return {};
  }
}

export async function writeKeys(keys: KeyStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // only persist known keys, drop empties
  const clean: KeyStore = {};
  for (const [k, v] of Object.entries(keys)) {
    if (KNOWN_ENVS.has(k) && typeof v === 'string' && v.trim() !== '') clean[k] = v.trim();
  }
  await fs.writeFile(KEYS_FILE, JSON.stringify(clean, null, 2), 'utf-8');
}

/** Push stored keys into process.env so all existing routes see them. */
export function applyToEnv(keys: KeyStore): void {
  for (const [k, v] of Object.entries(keys)) {
    if (KNOWN_ENVS.has(k) && v) process.env[k] = v;
  }
}

/** Mask a secret for display: keep last 4 chars. */
export function maskKey(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return '••••';
  return '••••' + value.slice(-4);
}
