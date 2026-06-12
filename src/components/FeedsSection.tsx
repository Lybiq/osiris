'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Trash2, Save, Rss, Tv, Zap, Check, XCircle, Camera, Search } from 'lucide-react';
import { authFetch } from '@/lib/authClient';
import { useToast } from '@/components/UiDialogs';

interface RssFeed { url: string; name: string; category?: string; }
interface YtStream { url: string; name: string; lat: number; lon: number; country?: string; }

export default function FeedsSection() {
  const toast = useToast();
  const [tab, setTab] = useState<'rss' | 'youtube' | 'cameras'>('rss');
  const [rssFeeds, setRssFeeds] = useState<RssFeed[]>([]);
  const [ytStreams, setYtStreams] = useState<YtStream[]>([]);
  const [customCams, setCustomCams] = useState<{url:string;name:string;lat:number;lon:number;type?:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [rssResults, setRssResults] = useState<Record<number, 'ok'|'fail'|'testing'>>({});
  const [ytResults, setYtResults] = useState<Record<number, 'ok'|'fail'|'testing'>>({});

  const testRssFeeds = async () => {
    setTesting(true);
    const results: Record<number, 'ok'|'fail'> = {};
    for (let i = 0; i < rssFeeds.length; i++) {
      setRssResults(prev => ({ ...prev, [i]: 'testing' }));
      try {
        const r = await fetch('/api/proxy-tiles?url=' + encodeURIComponent(rssFeeds[i].url), { signal: AbortSignal.timeout(8000) });
        results[i] = r.ok ? 'ok' : 'fail';
      } catch { results[i] = 'fail'; }
      setRssResults(prev => ({ ...prev, [i]: results[i] }));
    }
    setTesting(false);
    const ok = Object.values(results).filter(r => r === 'ok').length;
    toast(ok + '/' + rssFeeds.length + ' RSS-Feeds erreichbar');
  };

  const testYtStreams = async () => {
    setTesting(true);
    const results: Record<number, 'ok'|'fail'> = {};
    for (let i = 0; i < ytStreams.length; i++) {
      setYtResults(prev => ({ ...prev, [i]: 'testing' }));
      try {
        // Just check if URL is valid YouTube
        const valid = ytStreams[i].url.includes('youtube.com') || ytStreams[i].url.includes('youtu.be');
        results[i] = valid && ytStreams[i].url.length > 20 ? 'ok' : 'fail';
      } catch { results[i] = 'fail'; }
      setYtResults(prev => ({ ...prev, [i]: results[i] }));
    }
    setTesting(false);
    const ok = Object.values(results).filter(r => r === 'ok').length;
    toast(ok + '/' + ytStreams.length + ' Streams gültig');
  };

  const autoDetect = async (url: string, type: string): Promise<{name?:string;lat?:number;lon?:number;category?:string;country?:string}> => {
    try {
      const r = await authFetch('/api/admin/detect', { method: 'POST', body: JSON.stringify({ url, type }) });
      if (r.ok) return await r.json();
    } catch {}
    return {};
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rr, yr, cr] = await Promise.all([authFetch('/api/admin/feeds'), authFetch('/api/admin/streams'), authFetch('/api/admin/cameras')]);
      if (rr.ok) setRssFeeds(await rr.json());
      if (yr.ok) setYtStreams(await yr.json());
      if (cr.ok) setCustomCams(await cr.json());
    } catch (e) { toast((e as Error).message, 'err'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const saveRss = async () => {
    setSaving(true);
    const res = await authFetch('/api/admin/feeds', { method: 'POST', body: JSON.stringify({ feeds: rssFeeds }) });
    setSaving(false);
    if (res.ok) toast(`${rssFeeds.length} RSS-Feeds gespeichert`);
    else toast('Speichern fehlgeschlagen', 'err');
  };

  const saveYt = async () => {
    setSaving(true);
    const res = await authFetch('/api/admin/streams', { method: 'POST', body: JSON.stringify({ streams: ytStreams }) });
    setSaving(false);
    if (res.ok) toast(`${ytStreams.length} Streams gespeichert`);
    else toast('Speichern fehlgeschlagen', 'err');
  };

  return (
    <div className="p-4 overflow-y-auto flex-1 text-[10px] font-mono">
      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setTab('rss')} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] tracking-wider transition-colors ${tab === 'rss' ? 'bg-white/10 text-[var(--gold-primary)] border border-white/15' : 'text-white/40 border border-transparent hover:text-white/70'}`}>
          <Rss className="w-3 h-3" /> RSS FEEDS
        </button>
        <button onClick={() => setTab('youtube')} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] tracking-wider transition-colors ${tab === 'youtube' ? 'bg-white/10 text-[var(--gold-primary)] border border-white/15' : 'text-white/40 border border-transparent hover:text-white/70'}`}>
          <Tv className="w-3 h-3" /> YOUTUBE LIVE
        </button>
        <button onClick={() => setTab('cameras')} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] tracking-wider transition-colors ${tab === 'cameras' ? 'bg-white/10 text-[var(--gold-primary)] border border-white/15' : 'text-white/40 border border-transparent hover:text-white/70'}`}>
          <Camera className="w-3 h-3" /> CAMERAS
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
      ) : tab === 'rss' ? (
        <div className="flex flex-col gap-2">
          <p className="text-white/30 mb-1">RSS-Feeds für News und Konflikte. Werden als Nachrichtenquellen im Feed genutzt.</p>
          {rssFeeds.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={async () => { const d = await autoDetect(f.url, 'rss'); if (d.name) { const n = [...rssFeeds]; n[i] = { ...f, name: d.name || f.name, category: d.category || f.category }; setRssFeeds(n); toast('Erkannt: ' + (d.name || '?')); } else toast('Nicht erkannt', 'err'); }} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-[var(--cyan-primary)]" title="Auto-Erkennung"><Search className="w-3 h-3" /></button>
              <input value={f.name} onChange={e => { const n = [...rssFeeds]; n[i] = { ...f, name: e.target.value }; setRssFeeds(n); }} placeholder="Name" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/80 outline-none focus:border-[var(--gold-primary)]/50 w-[120px]" />
              <input value={f.url} onChange={e => { const n = [...rssFeeds]; n[i] = { ...f, url: e.target.value }; setRssFeeds(n); }} placeholder="https://..." className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/80 outline-none focus:border-[var(--gold-primary)]/50 flex-1" />
              <input value={f.category || ''} onChange={e => { const n = [...rssFeeds]; n[i] = { ...f, category: e.target.value }; setRssFeeds(n); }} placeholder="Kategorie" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/60 outline-none focus:border-[var(--gold-primary)]/50 w-[80px]" />
              {rssResults[i] === 'ok' && <Check className="w-3 h-3 text-green-400" />}
              {rssResults[i] === 'fail' && <XCircle className="w-3 h-3 text-red-400" />}
              {rssResults[i] === 'testing' && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
              <button onClick={() => setRssFeeds(rssFeeds.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button onClick={() => setRssFeeds([...rssFeeds, { url: '', name: '', category: 'news' }])} className="flex items-center gap-1 px-2 py-1 rounded border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5"><Plus className="w-3 h-3" /> Hinzufügen</button>
            <button onClick={saveRss} disabled={saving} className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--gold-primary)]/50 text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 hover:bg-[var(--gold-primary)]/20 disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SPEICHERN
            </button>
            <button onClick={testRssFeeds} disabled={testing} className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--cyan-primary)]/50 text-[var(--cyan-primary)] bg-[var(--cyan-primary)]/10 hover:bg-[var(--cyan-primary)]/20 disabled:opacity-50">
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} TESTEN
            </button>
          </div>
        </div>
      ) : tab === 'youtube' ? (
        <div className="flex flex-col gap-2">
          <p className="text-white/30 mb-1">YouTube-Live-Streams. Werden auf der Karte als Standorte angezeigt und sind im Viewer abspielbar.</p>
          {ytStreams.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <button onClick={async () => { const d = await autoDetect(s.url, 'youtube'); const n = [...ytStreams]; n[i] = { ...s, name: d.name || s.name, lat: d.lat || s.lat, lon: d.lon || s.lon, country: d.country || s.country }; setYtStreams(n); toast('Erkannt: ' + (d.name || '?')); }} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-[var(--cyan-primary)]" title="Auto-Erkennung"><Search className="w-3 h-3" /></button>
              <input value={s.name} onChange={e => { const n = [...ytStreams]; n[i] = { ...s, name: e.target.value }; setYtStreams(n); }} placeholder="Name" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/80 outline-none focus:border-[var(--gold-primary)]/50 w-[100px]" />
              <input value={s.url} onChange={e => { const n = [...ytStreams]; n[i] = { ...s, url: e.target.value }; setYtStreams(n); }} placeholder="YouTube URL" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/80 outline-none focus:border-[var(--gold-primary)]/50 flex-1 min-w-[140px]" />
              <input type="number" step="0.01" value={s.lat} onChange={e => { const n = [...ytStreams]; n[i] = { ...s, lat: parseFloat(e.target.value) || 0 }; setYtStreams(n); }} placeholder="Lat" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/60 outline-none w-[60px]" />
              <input type="number" step="0.01" value={s.lon} onChange={e => { const n = [...ytStreams]; n[i] = { ...s, lon: parseFloat(e.target.value) || 0 }; setYtStreams(n); }} placeholder="Lon" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/60 outline-none w-[60px]" />
              {ytResults[i] === 'ok' && <Check className="w-3 h-3 text-green-400" />}
              {ytResults[i] === 'fail' && <XCircle className="w-3 h-3 text-red-400" />}
              {ytResults[i] === 'testing' && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
              <button onClick={() => setYtStreams(ytStreams.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button onClick={() => setYtStreams([...ytStreams, { url: '', name: '', lat: 0, lon: 0 }])} className="flex items-center gap-1 px-2 py-1 rounded border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5"><Plus className="w-3 h-3" /> Hinzufügen</button>
            <button onClick={saveYt} disabled={saving} className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--gold-primary)]/50 text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 hover:bg-[var(--gold-primary)]/20 disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SPEICHERN
            </button>
            <button onClick={testYtStreams} disabled={testing} className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--cyan-primary)]/50 text-[var(--cyan-primary)] bg-[var(--cyan-primary)]/10 hover:bg-[var(--cyan-primary)]/20 disabled:opacity-50">
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} TESTEN
            </button>
          </div>
        </div>
      ) : tab === 'cameras' ? (
        /* ── Cameras tab ── */
        <div className="flex flex-col gap-2">
          <p className="text-white/30 mb-1">Eigene Kameras/Streams. Werden als zusätzliche CCTV-Quellen auf der Karte angezeigt.</p>
          {customCams.map((c, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <button onClick={async () => { const d = await autoDetect(c.url, 'camera'); const n = [...customCams]; n[i] = { ...c, name: d.name || c.name, lat: d.lat || c.lat, lon: d.lon || c.lon }; setCustomCams(n); toast('Erkannt: ' + (d.name || '?')); }} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-[var(--cyan-primary)]" title="Auto-Erkennung"><Search className="w-3 h-3" /></button>
              <input value={c.name} onChange={e => { const n = [...customCams]; n[i] = { ...c, name: e.target.value }; setCustomCams(n); }} placeholder="Name" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/80 outline-none focus:border-[var(--gold-primary)]/50 w-[100px]" />
              <input value={c.url} onChange={e => { const n = [...customCams]; n[i] = { ...c, url: e.target.value }; setCustomCams(n); }} placeholder="URL (Stream/Bild)" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/80 outline-none focus:border-[var(--gold-primary)]/50 flex-1 min-w-[140px]" />
              <input type="number" step="0.01" value={c.lat} onChange={e => { const n = [...customCams]; n[i] = { ...c, lat: parseFloat(e.target.value) || 0 }; setCustomCams(n); }} placeholder="Lat" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/60 outline-none w-[55px]" />
              <input type="number" step="0.01" value={c.lon} onChange={e => { const n = [...customCams]; n[i] = { ...c, lon: parseFloat(e.target.value) || 0 }; setCustomCams(n); }} placeholder="Lon" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white/60 outline-none w-[55px]" />
              <button onClick={() => setCustomCams(customCams.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button onClick={() => setCustomCams([...customCams, { url: '', name: '', lat: 0, lon: 0 }])} className="flex items-center gap-1 px-2 py-1 rounded border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5"><Plus className="w-3 h-3" /> Hinzufügen</button>
            <button onClick={async () => { setSaving(true); const r = await authFetch('/api/admin/cameras', { method: 'POST', body: JSON.stringify({ cameras: customCams }) }); setSaving(false); if (r.ok) toast(customCams.length + ' Kameras gespeichert'); else toast('Fehler', 'err'); }} disabled={saving} className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--gold-primary)]/50 text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 hover:bg-[var(--gold-primary)]/20 disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SPEICHERN
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
