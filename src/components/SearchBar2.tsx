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
  importance: number;
}

interface Props {
  onSelect: (lat: number, lon: number, label: string) => void;
  onClose?: () => void;
}

export default function SearchBar({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-suggest with debounce
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1&accept-language=de`,
        { headers: { 'User-Agent': 'OSINT/1.0' }, signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) setResults(await r.json());
    } catch { /* timeout ok */ }
    setLoading(false);
  }, []);

  const onInput = (val: string) => {
    setQuery(val);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 350);
  };

  const select = (r: SearchResult) => {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    const parts = r.display_name.split(',');
    const label = parts.slice(0, 2).join(',').trim();
    onSelect(lat, lon, label);
    setQuery(label);
    setOpen(false);
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); onClose?.(); }
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); inputRef.current?.focus(); setOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const getIcon = (r: SearchResult) => {
    if (r.class === 'building' || r.class === 'shop' || r.class === 'office') return <Building2 className="w-3 h-3 text-[var(--gold-primary)]" />;
    if (r.class === 'tourism' || r.class === 'historic' || r.class === 'amenity') return <Landmark className="w-3 h-3 text-[var(--cyan-primary)]" />;
    return <MapPin className="w-3 h-3 text-white/40" />;
  };

  return (
    <div className="relative w-[320px]">
      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10" style={GLASS_STYLE}>
        <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => onInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Ort, Straße, PLZ, Firma, POI…"
          className="bg-transparent outline-none w-full text-[11px] text-white/90 font-mono placeholder:text-white/25"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="text-white/30 hover:text-white/60">
            <X className="w-3 h-3" />
          </button>
        )}
        <span className="text-[7px] text-white/20 font-mono flex-shrink-0">⌘K</span>
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 rounded-lg border border-white/10 overflow-hidden z-[500] max-h-[300px] overflow-y-auto" style={GLASS_STYLE}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => select(r)}
              className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-white/8 transition-colors border-b border-white/5 last:border-0"
            >
              {getIcon(r)}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono text-white/80 truncate">{r.display_name.split(',').slice(0, 2).join(',')}</div>
                <div className="text-[8px] font-mono text-white/30 truncate">{r.display_name}</div>
              </div>
              <span className="text-[7px] font-mono text-white/20 flex-shrink-0 mt-0.5">{r.type}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="w-3 h-3 border border-white/20 border-t-[var(--cyan-primary)] rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
