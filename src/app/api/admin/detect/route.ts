import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/detect — auto-detect name + location from a URL
// Body: { url: string, type: 'rss' | 'youtube' | 'camera' }
export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, type } = await req.json() as { url?: string; type?: string };
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  try {
    if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      return NextResponse.json(await detectYouTube(url));
    }
    if (type === 'rss' || url.endsWith('.xml') || url.endsWith('.rss') || url.includes('/rss') || url.includes('/feed') || url.includes('atom')) {
      return NextResponse.json(await detectRss(url));
    }
    // Default: try as camera/generic
    return NextResponse.json(await detectGeneric(url));
  } catch (e) {
    return NextResponse.json({ name: '', lat: 0, lon: 0, error: (e as Error).message });
  }
}

async function detectYouTube(url: string) {
  const result: any = { name: '', lat: 0, lon: 0, country: '' };
  try {
    // Use oEmbed to get video title
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const r = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
    if (r.ok) {
      const d = await r.json();
      result.name = d.title || '';
      result.author = d.author_name || '';
      // Try to extract location from title (common patterns: "LIVE: City", "City - News")
      const titleParts = (result.name as string).split(/[-–|·:]/);
      if (titleParts.length > 1) {
        const possibleLocation = titleParts[titleParts.length - 1].trim();
        const geo = await geocodePlace(possibleLocation);
        if (geo) { result.lat = geo.lat; result.lon = geo.lon; result.country = geo.country; }
      }
      // If no location from title, try author name
      if (!result.lat && result.author) {
        const geo = await geocodePlace(result.author);
        if (geo) { result.lat = geo.lat; result.lon = geo.lon; result.country = geo.country; }
      }
    }
  } catch { /* best effort */ }
  return result;
}

async function detectRss(url: string) {
  const result: any = { name: '', category: 'news' };
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0' } });
    if (r.ok) {
      const text = await r.text();
      // Extract <title> from RSS/Atom
      const titleMatch = text.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      if (titleMatch) result.name = titleMatch[1].trim();
      // Try to detect category from URL
      if (url.includes('earthquake') || url.includes('seismic')) result.category = 'disaster';
      else if (url.includes('weather') || url.includes('storm')) result.category = 'weather';
      else if (url.includes('conflict') || url.includes('war') || url.includes('liveuamap')) result.category = 'conflict';
      else if (url.includes('cyber') || url.includes('malware')) result.category = 'cyber';
    }
  } catch { /* best effort */ }
  return result;
}

async function detectGeneric(url: string) {
  // Extract a reasonable name from the URL as fallback
  const urlObj = new URL(url);
  const fallbackName = urlObj.hostname.replace(/^www\./, '').split('.')[0] || 'Camera';
  const result: any = { name: fallbackName, lat: 0, lon: 0 };
  
  try {
    // First try HEAD to check content type
    const head = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0' }, redirect: 'follow' });
    const ct = head.headers.get('content-type') || '';
    
    // If it's an image/video stream, use hostname as name
    if (ct.includes('image/') || ct.includes('video/') || ct.includes('multipart/')) {
      // It's a direct stream/image - extract name from URL path
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1].replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        if (lastPart.length > 2) result.name = lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
      }
      result.name = result.name || urlObj.hostname;
      return result;
    }
    
    // For HTML pages, fetch and extract title
    if (ct.includes('text/html') || ct.includes('text/') || !ct) {
      const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0' }, redirect: 'follow' });
      if (r.ok) {
        const text = (await r.text()).slice(0, 20000);
        // Try multiple title patterns
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i) 
          || text.match(/<h1[^>]*>([^<]+)<\/h1>/i)
          || text.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
          || text.match(/<meta[^>]*name="title"[^>]*content="([^"]+)"/i);
        if (titleMatch) result.name = titleMatch[1].trim().slice(0, 100);
        
        // Try to find location from page content
        const geoMatch = text.match(/<meta[^>]*name="geo\.position"[^>]*content="([^"]+)"/i);
        if (geoMatch) {
          const [lat, lon] = geoMatch[1].split(';').map(Number);
          if (lat && lon) { result.lat = lat; result.lon = lon; }
        }
      }
    }
  } catch { /* best effort - timeout/unreachable is fine */ }
  
  return result;
}

async function geocodePlace(query: string): Promise<{ lat: number; lon: number; country: string } | null> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0' },
    });
    const d = await r.json();
    if (d && d[0]) {
      return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), country: d[0].display_name?.split(',').pop()?.trim() || '' };
    }
  } catch { /* best effort */ }
  return null;
}
