import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.OSIRIS_DATA_DIR || path.join(process.cwd(), 'data');

// ── RSS Feeds ──
export interface RssFeed { url: string; name: string; category?: string; }
const RSS_FILE = path.join(DATA_DIR, 'rss-feeds.json');

export async function readRssFeeds(): Promise<RssFeed[]> {
  try { return JSON.parse(await fs.readFile(RSS_FILE, 'utf-8')) || []; }
  catch { return getDefaultRssFeeds(); }
}

export async function writeRssFeeds(feeds: RssFeed[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(RSS_FILE, JSON.stringify(feeds, null, 2), 'utf-8');
}

function getDefaultRssFeeds(): RssFeed[] {
  return [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'news' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NY Times World', category: 'news' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', category: 'news' },
    { url: 'https://feeds.reuters.com/reuters/worldNews', name: 'Reuters World', category: 'news' },
    { url: 'https://www.spiegel.de/schlagzeilen/tops/index.rss', name: 'Spiegel', category: 'news-de' },
    { url: 'https://www.tagesschau.de/xml/rss2/', name: 'Tagesschau', category: 'news-de' },
    { url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.atom', name: 'USGS Earthquakes', category: 'disaster' },
    { url: 'https://gdacs.org/xml/rss.xml', name: 'GDACS Disasters', category: 'disaster' },
    { url: 'https://reliefweb.int/updates/rss.xml', name: 'ReliefWeb', category: 'disaster' },
    { url: 'https://liveuamap.com/rss', name: 'LiveUAMap', category: 'conflict' },
  ];
}

// ── YouTube Live Streams ──
export interface YtStream { url: string; name: string; lat: number; lon: number; country?: string; }
const YT_FILE = path.join(DATA_DIR, 'youtube-streams.json');

export async function readYtStreams(): Promise<YtStream[]> {
  try { return JSON.parse(await fs.readFile(YT_FILE, 'utf-8')) || []; }
  catch { return getDefaultYtStreams(); }
}

export async function writeYtStreams(streams: YtStream[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(YT_FILE, JSON.stringify(streams, null, 2), 'utf-8');
}

function getDefaultYtStreams(): YtStream[] {
  return [
    { url: 'https://www.youtube.com/watch?v=V1CNQT-DsME', name: 'Sky News', lat: 51.5074, lon: -0.1278, country: 'UK' },
    { url: 'https://www.youtube.com/watch?v=9Auq9mYxFEE', name: 'Al Jazeera English', lat: 25.2867, lon: 51.5333, country: 'QA' },
    { url: 'https://www.youtube.com/watch?v=GE_SfNVNyqk', name: 'DW News', lat: 50.7339, lon: 7.0999, country: 'DE' },
    { url: 'https://www.youtube.com/watch?v=F-POY4Q0wSo', name: 'France 24 English', lat: 48.8566, lon: 2.3522, country: 'FR' },
    { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', name: 'Lofi Girl', lat: 48.8566, lon: 2.3522, country: 'FR' },
    { url: 'https://www.youtube.com/watch?v=dp8PhLsUcFE', name: 'ABC News', lat: 40.7128, lon: -74.006, country: 'US' },
    { url: 'https://www.youtube.com/watch?v=w_Ma8oQLmSM', name: 'NBC News NOW', lat: 40.7128, lon: -74.006, country: 'US' },
    { url: 'https://www.youtube.com/watch?v=gAcKFobbEWs', name: 'NHK World Japan', lat: 35.6762, lon: 139.6503, country: 'JP' },
    { url: 'https://www.youtube.com/watch?v=XWq5kBlakcQ', name: 'India Today', lat: 28.6139, lon: 77.209, country: 'IN' },
    { url: 'https://www.youtube.com/watch?v=cYGFTmcR10U', name: 'WION', lat: 28.6139, lon: 77.209, country: 'IN' },
    { url: 'https://www.youtube.com/watch?v=ntRFMkczJo0', name: 'TRT World', lat: 41.0082, lon: 28.9784, country: 'TR' },
    { url: 'https://www.youtube.com/watch?v=vOTiJkg1voo', name: 'CGTN', lat: 39.9042, lon: 116.4074, country: 'CN' },
    { url: 'https://www.youtube.com/watch?v=fYQEae4YdOs', name: 'Euronews English', lat: 45.7640, lon: 4.8357, country: 'FR' },
    { url: 'https://www.youtube.com/watch?v=eMyTIwO-4Gs', name: 'RT News', lat: 55.7558, lon: 37.6173, country: 'RU' },
    { url: 'https://www.youtube.com/watch?v=_JQiEs32SqQ', name: 'i24NEWS English', lat: 32.0853, lon: 34.7818, country: 'IL' },
    { url: 'https://www.youtube.com/watch?v=ntLPcVAyNPE', name: 'Bloomberg TV', lat: 40.7128, lon: -74.006, country: 'US' },
    { url: 'https://www.youtube.com/watch?v=KTrKjx7XLcI', name: 'CNA (Channel NewsAsia)', lat: 1.3521, lon: 103.8198, country: 'SG' },
    { url: 'https://www.youtube.com/watch?v=U1vGOFnmnHs', name: 'Arirang TV (Korea)', lat: 37.5665, lon: 126.978, country: 'KR' },
    { url: 'https://www.youtube.com/watch?v=xL5vwluRLCQ', name: 'NDTV 24x7', lat: 28.6139, lon: 77.209, country: 'IN' },
    { url: 'https://www.youtube.com/watch?v=LLxMOrmRg80', name: 'ABC News Australia', lat: -33.8688, lon: 151.2093, country: 'AU' },
    { url: 'https://www.youtube.com/watch?v=emWMFmZsAKc', name: 'KBS World (Korea)', lat: 37.5665, lon: 126.978, country: 'KR' },
    { url: 'https://www.youtube.com/watch?v=h3MuIUNCCzI', name: 'CBC News (Canada)', lat: 45.4215, lon: -75.6972, country: 'CA' },
    { url: 'https://www.youtube.com/watch?v=86g1JGN0SPA', name: 'GB News', lat: 51.5074, lon: -0.1278, country: 'UK' },
  ];
}


// ── Telegram Channels ──
export interface TelegramFeed { url: string; name: string; category?: string; country?: string; }
const TG_FILE = path.join(DATA_DIR, 'telegram-feeds.json');

export async function readTelegramFeeds(): Promise<TelegramFeed[]> {
  try { return JSON.parse(await fs.readFile(TG_FILE, 'utf-8')) || []; }
  catch { return getDefaultTelegramFeeds(); }
}

export async function writeTelegramFeeds(feeds: TelegramFeed[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TG_FILE, JSON.stringify(feeds, null, 2), 'utf-8');
}

function getDefaultTelegramFeeds(): TelegramFeed[] {
  return [
    { url: 'https://t.me/s/liveuamap', name: 'LiveUAMap', category: 'conflict', country: 'UA' },
    { url: 'https://t.me/s/inaborysenko', name: 'Illia Ponomarenko', category: 'conflict', country: 'UA' },
    { url: 'https://t.me/s/ryaborsneak', name: 'RWApodcast', category: 'conflict' },
    { url: 'https://t.me/s/nexaborta_en', name: 'Nexta', category: 'news', country: 'BY' },
    { url: 'https://t.me/s/bbcukrainianservice', name: 'BBC Ukrainian', category: 'news', country: 'UA' },
    { url: 'https://t.me/s/osaborintinsider', name: 'OSINT Insider', category: 'osint' },
  ];
}

// ── Custom Cameras (admin-managed) ──
export interface CustomCamera { url: string; name: string; lat: number; lon: number; type?: string; }
const CAM_FILE = path.join(DATA_DIR, 'custom-cameras.json');

export async function readCustomCameras(): Promise<CustomCamera[]> {
  try { return JSON.parse(await fs.readFile(CAM_FILE, 'utf-8')) || []; }
  catch { return []; }
}

export async function writeCustomCameras(cams: CustomCamera[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CAM_FILE, JSON.stringify(cams, null, 2), 'utf-8');
}

// ── Git Config (for updates) ──
export interface GitConfig { userName: string; userEmail: string; }
const GIT_FILE = path.join(DATA_DIR, 'git-config.json');

export async function readGitConfig(): Promise<GitConfig> {
  try { return JSON.parse(await fs.readFile(GIT_FILE, 'utf-8')); }
  catch { return { userName: 'OSINT System', userEmail: 'osint@local' }; }
}

export async function writeGitConfig(config: GitConfig): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(GIT_FILE, JSON.stringify(config, null, 2), 'utf-8');
}
