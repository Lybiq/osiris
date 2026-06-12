'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/UiDialogs';
import { X, MapPin, Copy, ExternalLink, Navigation } from 'lucide-react';

interface LocationData {
  lat: number;
  lon: number;
  address?: {
    name?: string;
    road?: string;
    houseNumber?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  loading?: boolean;
}

interface Props {
  data: LocationData | null;
  onClose: () => void;
}

export default function LocationInfoPanel({ data, onClose }: Props) {
  const toast = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 60, y: 80 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Dragging
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const copyCoords = () => {
    if (!data) return;
    const txt = `${data.lat.toFixed(6)}, ${data.lon.toFixed(6)}`;
    navigator.clipboard.writeText(txt).then(() => toast('📋 ' + txt + ' kopiert')).catch(() => {});
  };

  const copyAddress = () => {
    if (!data?.address) return;
    const a = data.address;
    const parts = [a.name, a.road ? `${a.road}${a.houseNumber ? ' ' + a.houseNumber : ''}` : '', a.postcode, a.city, a.state, a.country].filter(Boolean);
    navigator.clipboard.writeText(parts.join(', ')).then(() => toast('📋 Adresse kopiert')).catch(() => {});
  };

  const ll = data ? `${data.lat},${data.lon}` : '';
  const a = data?.address;
  const place = a ? [a.city || '', a.state || '', a.country || ''].filter(Boolean).join(', ') : '';

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed z-[800] w-[280px] glass-panel overflow-hidden pointer-events-auto"
          style={{ left: pos.x, top: pos.y, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
        >
          {/* Draggable header */}
          <div
            onMouseDown={onMouseDown}
            className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-primary)] cursor-grab active:cursor-grabbing select-none"
          >
            <MapPin className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span className="hud-text text-[11px] text-[var(--text-primary)] tracking-[0.15em] flex-1">MAP LOCATION</span>
            <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--hover-accent)] text-[var(--text-muted)] hover:text-[var(--alert-red)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 flex flex-col gap-2 text-[10px] font-mono">
            {data.loading ? (
              <div className="text-[var(--text-muted)] animate-pulse">Loading location...</div>
            ) : (
              <>
                <Row label="LAT" value={data.lat.toFixed(6)} />
                <Row label="LON" value={data.lon.toFixed(6)} />
                {a?.name && <Row label="Name" value={a.name} />}
                {a?.road && <Row label="Straße" value={`${a.road}${a.houseNumber ? ' ' + a.houseNumber : ''}`} />}
                {place && <Row label="Ort" value={place} />}
                {a?.postcode && <Row label="PLZ" value={a.postcode} />}
                {a?.country && <Row label="Land" value={a.country} />}
              </>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-1.5 mt-1 pt-2 border-t border-[var(--border-secondary)]">
              <LinkBtn href={`https://www.google.com/maps?q=${ll}`} label="Google Maps" />
              <LinkBtn href={`https://maps.apple.com/?q=${ll}`} label="Apple Maps" />
              <LinkBtn href={`https://www.bing.com/maps?cp=${data.lat}~${data.lon}&lvl=17`} label="Bing Maps" />
              <button onClick={copyCoords} className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--cyan-primary)] hover:border-[var(--cyan-primary)]/40 transition-colors text-[9px]">
                <Copy className="w-3 h-3" /> Koordinaten
              </button>
              {a && !data.loading && (
                <button onClick={copyAddress} className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--cyan-primary)] hover:border-[var(--cyan-primary)]/40 transition-colors text-[9px]">
                  <Copy className="w-3 h-3" /> Adresse
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[var(--text-muted)] w-[40px] flex-shrink-0 text-right">{label}</span>
      <span className="text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function LinkBtn({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--gold-primary)] hover:border-[var(--gold-primary)]/40 transition-colors text-[9px]">
      <Navigation className="w-3 h-3" /> {label}
    </a>
  );
}
