import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.OSIRIS_DATA_DIR || path.join(process.cwd(), 'data');
const KEYS_FILE = path.join(DATA_DIR, 'apikeys.json');

export interface KeyDef {
  env: string;
  label: string;
  hint: string;
  secret?: boolean;
  section: string;
}

export const KEY_DEFS: KeyDef[] = [
  // ✈ FLIGHTS
  { env: 'OPENSKY_CLIENT_ID', label: 'OpenSky Username', hint: 'opensky-network.org — free, enables higher rate limits', secret: false, section: '✈ FLIGHTS' },
  { env: 'OPENSKY_CLIENT_SECRET', label: 'OpenSky Password', hint: 'opensky-network.org — same credentials as web login', secret: true, section: '✈ FLIGHTS' },
  { env: 'ADSB_API_KEY', label: 'ADSB Exchange Key', hint: 'adsbexchange.com — commercial API key for live aircraft data', secret: true, section: '✈ FLIGHTS' },
  { env: 'FR24_API_KEY', label: 'FlightRadar24 Key', hint: 'flightradar24.com — Premium / Business plan required', secret: true, section: '✈ FLIGHTS' },

  // 🚢 SHIPS
  { env: 'AIS_API_KEY', label: 'AISstream.io Key', hint: 'aisstream.io — free tier available, WebSocket AIS stream', secret: true, section: '🚢 SHIPS' },
  { env: 'MARINETRAFFIC_KEY', label: 'MarineTraffic Key', hint: 'marinetraffic.com — vessel tracking API key', secret: true, section: '🚢 SHIPS' },
  { env: 'VESSELTRACKER_KEY', label: 'VesselTracker Key', hint: 'vesseltracker.com — REST API key for ship positions', secret: true, section: '🚢 SHIPS' },
  { env: 'VESSELFINDER_KEY', label: 'VesselFinder Key', hint: 'vesselfinder.com — user key for vessel position API', secret: true, section: '🚢 SHIPS' },

  // 🛰 SATELLITES
  { env: 'N2YO_API_KEY', label: 'N2YO API Key', hint: 'n2yo.com/api — free key for satellite TLE & pass predictions', secret: true, section: '🛰 SATELLITES' },

  // 🌤 WEATHER
  { env: 'OPENWEATHER_KEY', label: 'OpenWeatherMap Key', hint: 'openweathermap.org — free tier: 60 calls/min', secret: true, section: '🌤 WEATHER' },
  { env: 'STORMGLASS_KEY', label: 'StormGlass Key', hint: 'stormglass.io — marine & weather API, 10 calls/day free', secret: true, section: '🌤 WEATHER' },
  { env: 'IQAIR_KEY', label: 'IQAir API Key', hint: 'iqair.com — air quality index, free community tier', secret: true, section: '🌤 WEATHER' },

  // 🔥 EVENTS
  { env: 'FIRMS_API_KEY', label: 'NASA FIRMS', hint: 'firms.modaps.eosdis.nasa.gov — active fire data', secret: true, section: '🔥 EVENTS' },
  { env: 'AMBEE_KEY', label: 'Ambee Wildfire Key', hint: 'ambeedata.com — real-time wildfire & environmental data', secret: true, section: '🔥 EVENTS' },
  { env: 'GDACS_KEY', label: 'GDACS Key', hint: 'gdacs.org — Global Disaster Alert, optional for higher limits', secret: true, section: '🔥 EVENTS' },

  // 🚌 TRANSIT
  { env: 'TRANSITLAND_KEY', label: 'Transitland API Key', hint: 'transit.land — global transit data, free tier: 100k req/month', secret: true, section: '🚌 TRANSIT' },

  // 🗺 MAPS
  { env: 'MAPTILER_KEY', label: 'MapTiler Key', hint: 'maptiler.com — free tier: 100k tiles/month', secret: true, section: '🗺 MAPS' },
  { env: 'THUNDERFOREST_KEY', label: 'Thunderforest Key', hint: 'thunderforest.com — free tier: 150k tiles/month', secret: true, section: '🗺 MAPS' },
  { env: 'GOOGLE_PLACES_KEY', label: 'Google Places Key', hint: 'Google Cloud Console — enables POI data & place details', secret: true, section: '🗺 MAPS' },


  // ✈ FLIGHTS (additional)
  { env: 'ADSBLOL_KEY', label: 'adsb.lol Key', hint: 'adsb.lol — community flight tracker, free tier available', secret: true, section: '✈ FLIGHTS' },
  { env: 'AIRPLANESLIVE_KEY', label: 'AirplanesLive Key', hint: 'airplanes.live — real-time ADS-B data', secret: true, section: '✈ FLIGHTS' },
  { env: 'ADSBFI_KEY', label: 'adsb.fi Key', hint: 'adsb.fi — Finnish ADS-B network', secret: true, section: '✈ FLIGHTS' },
  { env: 'AVIATIONSTACK_KEY', label: 'AviationStack Key', hint: 'aviationstack.com — flight data API, free tier: 100 req/month', secret: true, section: '✈ FLIGHTS' },

  // 🚢 SHIPS (additional)
  { env: 'MYSHIPTRACKING_KEY', label: 'MyShipTracking Key', hint: 'myshiptracking.com — AIS vessel tracking', secret: true, section: '🚢 SHIPS' },
  { env: 'SHIPFINDER_KEY', label: 'ShipFinder Key', hint: 'shipfinder.co — live ship tracking API', secret: true, section: '🚢 SHIPS' },

  // 📡 OSINT
  { env: 'SHODAN_KEY', label: 'Shodan API Key', hint: 'shodan.io — IoT/device search engine', secret: true, section: '📡 OSINT' },
  { env: 'CENSYS_KEY', label: 'Censys API Key', hint: 'censys.io — internet-wide scan data', secret: true, section: '📡 OSINT' },
  { env: 'VIRUSTOTAL_KEY', label: 'VirusTotal Key', hint: 'virustotal.com — malware/URL analysis', secret: true, section: '📡 OSINT' },

  // 🤖 AI
  { env: 'GEMINI_API_KEY_1', label: 'Gemini API Key', hint: 'aistudio.google.com/apikey — KI-Analyse', secret: true, section: '🤖 AI' },
];

const KNOWN_ENVS = new Set(KEY_DEFS.map(k => k.env));
export const KEY_SECTIONS = [...new Set(KEY_DEFS.map(k => k.section))];

export type KeyStore = Record<string, string>;

export async function readKeys(): Promise<KeyStore> {
  try {
    return JSON.parse(await fs.readFile(KEYS_FILE, 'utf-8')) || {};
  } catch { return {}; }
}

export async function writeKeys(keys: KeyStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const clean: KeyStore = {};
  for (const [k, v] of Object.entries(keys)) {
    if (KNOWN_ENVS.has(k) && typeof v === 'string' && v.trim() !== '') clean[k] = v.trim();
  }
  await fs.writeFile(KEYS_FILE, JSON.stringify(clean, null, 2), 'utf-8');
}

export function applyToEnv(keys: KeyStore): void {
  for (const [k, v] of Object.entries(keys)) {
    if (KNOWN_ENVS.has(k) && v) process.env[k] = v;
  }
}

export function maskKey(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return '••••';
  return '••••' + value.slice(-4);
}
