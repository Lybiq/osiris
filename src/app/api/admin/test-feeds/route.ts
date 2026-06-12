import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
];
function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }

interface TestItem {
  url: string;
  type: 'rss' | 'youtube' | 'camera';
  name?: string;
  lat?: number;
  lon?: number;
}

interface TestResult {
  index: number;
  online: boolean;
  name?: string;
  lat?: number;
  lon?: number;
  country?: string;
  category?: string;
  error?: string;
  ms: number;
}

// POST /api/admin/test-feeds — batch test + auto-detect for RSS/YouTube/Camera URLs
export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { items } = await req.json() as { items: TestItem[] };
  if (!Array.isArray(items)) return NextResponse.json({ error: 'items array required' }, { status: 400 });

  const results: TestResult[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const t0 = Date.now();
    try {
      if (item.type === 'rss') {
        results.push(await testRss(i, item, t0));
      } else if (item.type === 'youtube') {
        results.push(await testYoutube(i, item, t0));
      } else {
        results.push(await testCamera(i, item, t0));
      }
    } catch (e) {
      results.push({ index: i, online: false, error: (e as Error).message, ms: Date.now() - t0 });
    }
  }

  return NextResponse.json(results);
}

async function testRss(index: number, item: TestItem, t0: number): Promise<TestResult> {
  const r = await fetch(item.url, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': randomUA(), 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
  });
  const ms = Date.now() - t0;
  if (!r.ok) return { index, online: false, error: `HTTP ${r.status}`, ms };

  const text = await r.text();
  const titleMatch = text.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
  const name = titleMatch ? titleMatch[1].trim() : undefined;

  let category = 'news';
  if (item.url.includes('earthquake') || item.url.includes('seismic') || item.url.includes('gdacs')) category = 'disaster';
  else if (item.url.includes('conflict') || item.url.includes('war') || item.url.includes('liveuamap')) category = 'conflict';

  return { index, online: true, name, category, ms };
}

async function testYoutube(index: number, item: TestItem, t0: number): Promise<TestResult> {
  // Use oEmbed to check availability + get title
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(item.url)}&format=json`;
  const r = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
  const ms = Date.now() - t0;

  if (!r.ok) return { index, online: false, error: `oEmbed HTTP ${r.status}`, ms };

  const d = await r.json();
  const name = d.title || undefined;
  const author = d.author_name || '';

  // Try to geocode from title or author
  let lat = item.lat, lon = item.lon, country = '';
  if ((!lat || lat === 0) && name) {
    const parts = name.split(/[-–|·:]/);
    for (const part of parts.reverse()) {
      const geo = await geocode(part.trim());
      if (geo) { lat = geo.lat; lon = geo.lon; country = geo.country; break; }
    }
    if (!lat && author) {
      const geo = await geocode(author);
      if (geo) { lat = geo.lat; lon = geo.lon; country = geo.country; }
    }
  }

  return { index, online: true, name, lat, lon, country, ms };
}

async function testCamera(index: number, item: TestItem, t0: number): Promise<TestResult> {
  const r = await fetch(item.url, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': randomUA() },
    method: 'HEAD', // Just check if URL is reachable
  });
  const ms = Date.now() - t0;

  let name = item.name;
  if (!name && r.ok) {
    // Try GET to extract title
    try {
      const full = await fetch(item.url, { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': randomUA() } });
      const text = (await full.text()).slice(0, 5000);
      const m = text.match(/<title[^>]*>(.*?)<\/title>/i);
      if (m) name = m[1].trim().slice(0, 80);
    } catch { /* ok */ }
  }

  return { index, online: r.ok, name, error: r.ok ? undefined : `HTTP ${r.status}`, ms };
}

async function geocode(query: string): Promise<{ lat: number; lon: number; country: string } | null> {
  if (!query || query.length < 3) return null;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
      signal: AbortSignal.timeout(3000), headers: { 'User-Agent': randomUA() },
    });
    const d = await r.json();
    if (d?.[0]) return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), country: d[0].display_name?.split(',').pop()?.trim() || '' };
  } catch { /* ok */ }
  return null;
}
