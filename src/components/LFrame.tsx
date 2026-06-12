'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Ship, Camera, Flame, Shield, Network, Monitor, Eye, Database, Activity,
  Satellite, Tv, CloudLightning, Radiation, AlertTriangle, Radio, Anchor, Sun,
  Target, ChevronRight, ChevronLeft, Check, X as XIcon
} from 'lucide-react';

// ── Glass style (shared by the entire L-frame + all windows) ──
export const GLASS_STYLE = {
  background: 'rgba(60,60,60,0.40)',
  backdropFilter: 'blur(22px) saturate(1.5)',
  WebkitBackdropFilter: 'blur(22px) saturate(1.5)',
} as const;

// ── Layer definitions (moved here so L-frame owns its own data) ──
const GROUP_ICONS: Record<string, typeof Plane> = {
  SDK: Database, AVIATION: Plane, MARITIME: Ship, SURVEIL: Eye,
  HAZARD: Flame, THREAT: Shield, NETWORK: Network, DISPLAY: Monitor,
};

interface LFrameProps {
  // Header
  sysStatus: 'ok' | 'warn' | 'error' | 'checking';
  onSystemClick: () => void;
  onAdminClick?: () => void;
  isAdmin?: boolean;
  clockDisplay: ReactNode;
  // Sidebar
  layerGroups: { label: string; fullLabel: string; color: string; layers: { key: string; label: string; color: string; icon?: any; dataKey: string }[] }[];
  activeLayers: Record<string, boolean>;
  setActiveLayers: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  data?: Record<string, unknown[]>;
}

const SIDEBAR_W = 72;
const SIDEBAR_EXP_W = 220;
const HEADER_H = 34;

export default function LFrame({
  sysStatus, onSystemClick, onAdminClick, isAdmin, clockDisplay,
  layerGroups, activeLayers, setActiveLayers, data,
}: LFrameProps) {
  const [expanded, setExpanded] = useState(false);
  const sideW = expanded ? SIDEBAR_EXP_W : SIDEBAR_W;

  const getCount = (dataKey: string): number | null => {
    if (!data || !dataKey) return null;
    return dataKey.split(',').reduce((sum, k) => {
      const arr = data[k.trim()];
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
  };

  const toggle = (key: string) => setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const selectAll = () => {
    const all: Record<string, boolean> = {};
    layerGroups.forEach(g => g.layers.forEach(l => { all[l.key] = true; }));
    setActiveLayers(prev => ({ ...prev, ...all }));
  };

  const deselectAll = () => {
    const off: Record<string, boolean> = {};
    layerGroups.forEach(g => g.layers.forEach(l => { off[l.key] = false; }));
    setActiveLayers(prev => ({ ...prev, ...off }));
  };

  return (
    <>
      {/* ═══ HEADER BAR (top of L) ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.5 }}
        className="fixed top-0 left-0 right-0 z-[300] pointer-events-none"
        style={{ height: HEADER_H }}
      >
        <div className="h-full flex items-center pointer-events-auto" style={GLASS_STYLE}>
          {/* Left: OSINT brand */}
          <div className="flex items-center gap-2 pl-3" style={{ width: sideW, flexShrink: 0, transition: 'width 0.3s ease', minWidth: sideW }}>
            <h1 className="text-[13px] font-bold tracking-[0.3em] text-[var(--gold-primary)] font-mono">OSINT</h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: SYSTEM → Ort/Uhrzeit → ADMIN */}
          <div className="flex items-center gap-4 pr-3 text-[9px] font-mono tracking-widest">
            <button onClick={onSystemClick} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity text-[var(--text-muted)]">
              SYSTEM
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${sysStatus === 'ok' ? 'bg-[var(--alert-green)]' : sysStatus === 'error' ? 'bg-[var(--alert-red)] animate-pulse' : 'bg-[var(--gold-primary)] animate-pulse'}`}
                style={{ boxShadow: sysStatus === 'ok' ? '0 0 6px var(--alert-green)' : sysStatus === 'error' ? '0 0 6px var(--alert-red)' : '0 0 6px var(--gold-primary)' }}
              />
              {sysStatus === 'error' && <AlertTriangle className="w-3 h-3 text-[var(--alert-red)] animate-pulse" />}
            </button>

            <span className="text-[10px] text-[var(--cyan-primary)] font-bold tabular-nums">{clockDisplay}</span>

            {isAdmin && onAdminClick && (
              <button onClick={onAdminClick} className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity text-[var(--gold-primary)]">
                <Shield className="w-3 h-3" />
                ADMIN
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ SIDEBAR (left leg of L) ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 2.6 }}
        className="fixed left-0 z-[290] flex flex-col pointer-events-auto overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ ...GLASS_STYLE, top: HEADER_H, bottom: 0, width: sideW }}
      >
        {/* Collapse toggle (inside the glass) */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center justify-center py-2 text-[var(--text-muted)] hover:text-[var(--gold-primary)] transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Select All / Deselect All */}
        <div className="flex items-center justify-center gap-3 px-2 py-1 flex-shrink-0 border-b border-white/5">
          <button onClick={selectAll} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--alert-green)] transition-colors" title="Alle aktivieren">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={deselectAll} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--alert-red)] transition-colors" title="Alle deaktivieren">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layer groups */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {!expanded ? (
            /* ── Collapsed: icons only, click expands sidebar ── */
            <div className="flex flex-col gap-1 items-center px-1">
              {layerGroups.map(group => {
                const activeCount = group.layers.filter(l => activeLayers[l.key]).length;
                const isActive = activeCount > 0;
                const GIcon = GROUP_ICONS[group.label] || Target;
                return (
                  <button
                    key={group.label}
                    onClick={() => setExpanded(true)}
                    className="relative w-11 h-11 flex flex-col items-center justify-center gap-0.5 rounded-lg hover:bg-white/8 transition-colors"
                    title={group.fullLabel}
                  >
                    {isActive && (
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.color, boxShadow: `0 0 5px ${group.color}` }} />
                    )}
                    <GIcon className="w-4 h-4" style={{ color: isActive ? group.color : 'rgba(255,255,255,0.3)', filter: isActive ? `drop-shadow(0 0 3px ${group.color}80)` : 'none' }} />
                    <span className="text-[5px] font-mono tracking-wider" style={{ color: isActive ? group.color : 'rgba(255,255,255,0.25)' }}>{group.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* ── Expanded: full layer list ── */
            <div className="flex flex-col gap-3 px-3">
              {layerGroups.map(group => (
                <div key={group.label}>
                  <div className="text-[9px] font-bold font-mono tracking-widest pb-1 mb-1 border-b border-white/8" style={{ color: group.color }}>{group.fullLabel}</div>
                  {group.layers.map(layer => {
                    const isLayerActive = activeLayers[layer.key];
                    const count = getCount(layer.dataKey);
                    const Icon = layer.icon || Shield;
                    return (
                      <button
                        key={layer.key}
                        onClick={() => toggle(layer.key)}
                        className="w-full flex items-center gap-2 px-1.5 py-1 rounded hover:bg-white/5 transition-colors group"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full border flex-shrink-0 ${isLayerActive ? 'bg-current border-current' : 'bg-transparent border-white/25 scale-75'}`} style={{ color: isLayerActive ? layer.color : 'inherit', boxShadow: isLayerActive ? `0 0 6px ${layer.color}` : 'none' }} />
                        <Icon className="w-3 h-3 flex-shrink-0" style={{ color: isLayerActive ? layer.color : 'rgba(255,255,255,0.3)' }} />
                        <span className={`text-[10px] font-mono uppercase tracking-wider flex-1 text-left ${isLayerActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}>{layer.label}</span>
                        {count !== null && count > 0 && <span className="text-[8px] font-mono tabular-nums opacity-50">{count.toLocaleString()}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
