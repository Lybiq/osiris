'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X, Building2, Landmark } from 'lucide-react';
import { GLASS_STYLE } from '@/components/LFrame';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

interface Props {
  onSelect: (lat: number, lon: number, label: string) => void;
  onClose?: () => void;
}

export default function SearchBar2({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=de`,
        { headers: { 'User-Agent': 'OSINT/1.0' }, signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) setResults(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  const onInput = (val: string) => {
    setQuery(val);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 300);
  };

  const select = (r: SearchResult) => {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    const label = r.display_name.split(',').slice(0, 2).join(',').trim();
    onSelect(lat, lon, label);
    setQuery(label);
    setOpen(false);
  };

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); onClose?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('search-pill-container');
      if (el && !el.contains(e.target as Node)) { onClose?.(); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const getIcon = (r: SearchResult) => {
    if (r.class === 'building' || r.class === 'shop' || r.class === 'office') return <Building2 className="w-3.5 h-3.5 text-[var(--gold-primary)]" />;
    if (r.class === 'tourism' || r.class === 'historic' || r.class === 'amenity') return <Landmark className="w-3.5 h-3.5 text-[var(--cyan-primary)]" />;
    return <MapPin className="w-3.5 h-3.5 text-white/40" />;
  };

  return (
    <div id="search-pill-container" className="w-[480px] max-w-[90vw]">
      {/* Apple-style pill */}
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/12 shadow-2xl"
        style={{ ...GLASS_STYLE, boxShadow: '0 8px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)' }}
      >
        <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => onInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Suche…"
          className="bg-transparent outline-none w-full text-[14px] text-white/90 font-light placeholder:text-white/25"
        />
        {loading && <div className="w-4 h-4 border-2 border-white/10 border-t-[var(--cyan-primary)] rounded-full animate-spin flex-shrink-0" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="text-white/25 hover:text-white/50">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div
          className="mt-2 rounded-xl border border-white/10 overflow-hidden max-h-[320px] overflow-y-auto"
          style={{ ...GLASS_STYLE, boxShadow: '0 12px 50px rgba(0,0,0,0.5)' }}
        >
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => select(r)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/8 transition-colors border-b border-white/5 last:border-0"
            >
              {getIcon(r)}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-white/85 truncate">{r.display_name.split(',').slice(0, 2).join(',')}</div>
                <div className="text-[10px] text-white/30 truncate">{r.display_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
