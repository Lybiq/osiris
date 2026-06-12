'use client';

import { motion } from 'framer-motion';
import { Map as MapIcon, Check } from 'lucide-react';
import { BASEMAPS, BASEMAP_GROUPS } from '@/lib/basemaps';

interface BasemapSwitcherProps {
  current: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function BasemapSwitcher({ current, onSelect, onClose }: BasemapSwitcherProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      className="glass-panel p-3 pointer-events-auto w-[230px] max-h-[60vh] overflow-y-auto"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <MapIcon className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
        <span className="hud-text text-[12px] text-[var(--text-primary)] tracking-widest">MAP VIEWS</span>
        <button
          onClick={onClose}
          className="ml-auto text-[var(--text-muted)] hover:text-[var(--alert-red)] text-[14px] leading-none"
        >
          ×
        </button>
      </div>

      {BASEMAP_GROUPS.map(group => (
        <div key={group} className="mb-2 last:mb-0">
          <div className="text-[8px] tracking-[0.2em] text-[var(--text-muted)] font-mono mb-1 px-1">
            {group.toUpperCase()}
          </div>
          <div className="flex flex-col gap-0.5">
            {BASEMAPS.filter(b => b.group === group).map(b => {
              const active = b.value === current;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelect(b.value)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-mono tracking-wide border transition-all ${
                    active
                      ? 'border-[var(--border-active)] bg-[var(--hover-accent)] text-[var(--gold-primary)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--hover-accent)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {active ? (
                    <Check className="w-3 h-3 flex-shrink-0 text-[var(--gold-primary)]" />
                  ) : (
                    <span className="w-3 flex-shrink-0" />
                  )}
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
