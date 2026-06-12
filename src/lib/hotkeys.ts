import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.OSIRIS_DATA_DIR || path.join(process.cwd(), 'data');
const HOTKEYS_FILE = path.join(DATA_DIR, 'hotkeys.json');

export interface HotkeyDef {
  id: string;
  label: string;
  description: string;
  defaultKey: string;
  key?: string; // user override
}

export const DEFAULT_HOTKEYS: HotkeyDef[] = [
  { id: 'search', label: 'Suche öffnen', description: 'Suchleiste ein-/ausblenden', defaultKey: 'Ctrl+K' },
  { id: 'toggle_flights', label: 'Flüge', description: 'Flugverkehr Layer toggeln', defaultKey: 'F' },
  { id: 'toggle_ships', label: 'Schiffe', description: 'Schiffsverkehr Layer toggeln', defaultKey: 'M' },
  { id: 'toggle_cctv', label: 'Kameras', description: 'CCTV Kameras Layer toggeln', defaultKey: 'C' },
  { id: 'toggle_earthquakes', label: 'Erdbeben', description: 'Erdbeben Layer toggeln', defaultKey: 'E' },
  { id: 'toggle_fires', label: 'Brände', description: 'Aktive Brände Layer toggeln', defaultKey: 'I' },
  { id: 'toggle_weather', label: 'Wetter', description: 'Wetter Layer toggeln', defaultKey: 'W' },
  { id: 'toggle_conflicts', label: 'Konflikte', description: 'Konfliktzonen Layer toggeln', defaultKey: 'X' },
  { id: 'toggle_daynight', label: 'Tag/Nacht', description: 'Tag/Nacht Zyklus toggeln', defaultKey: 'N' },
  { id: 'globe_toggle', label: '2D/3D', description: 'Zwischen Globe und 2D wechseln', defaultKey: 'G' },
  { id: 'time_travel', label: 'Time Travel', description: 'Historische Satellitenbilder', defaultKey: 'T' },
  { id: 'fullscreen', label: 'Vollbild', description: 'Vollbildmodus', defaultKey: 'F11' },
];

export type HotkeyStore = Record<string, string>; // id -> custom key

export async function readHotkeys(): Promise<HotkeyStore> {
  try { return JSON.parse(await fs.readFile(HOTKEYS_FILE, 'utf-8')) || {}; }
  catch { return {}; }
}

export async function writeHotkeys(keys: HotkeyStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(HOTKEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
}

export function getMergedHotkeys(overrides: HotkeyStore): HotkeyDef[] {
  return DEFAULT_HOTKEYS.map(h => ({ ...h, key: overrides[h.id] || h.defaultKey }));
}
