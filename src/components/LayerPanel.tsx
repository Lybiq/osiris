'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Satellite, Activity, Sun, AlertTriangle, Camera, Flame, Target,
  CloudLightning, Radiation, Tv, Anchor, Ship, Newspaper,
  Network, Share2, Radio, ChevronLeft, ChevronRight,
  Shield, Database, Eye, Monitor
} from 'lucide-react';

interface LayerPanelProps {
  data: any;
  activeLayers: any;
  setActiveLayers: React.Dispatch<React.SetStateAction<any>>;
  isMobile?: boolean;
  theme?: 'core' | 'ghost';
  setTheme?: (theme: 'core' | 'ghost') => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export const getLayerGroups = (theme: 'core' | 'ghost') => {
  const isGhost = theme === 'ghost';
  const phantomPurple = '#B388FF';
  const ghostPriv = '#CE93D8';
  const ghostGov = '#D500F9';

  const flightCom = isGhost ? phantomPurple : '#00E5FF';
  const flightPriv = isGhost ? ghostPriv : '#FFD700';
  const flightGov = isGhost ? ghostGov : '#FF9500';
  const flightMil = '#FF0000';

  return [
  {
    label: 'SDK', groupIcon: Database,
    fullLabel: 'OSINT SDK',
    color: '#1565C0',
    layers: [
      { key: 'sdk_sea', label: 'Maritime Lines', icon: Anchor, color: '#4FC3F7', dataKey: 'sdk_entities' },
      { key: 'sdk_ransomware', label: 'Ransomware Feed', icon: AlertTriangle, color: '#D32F2F', dataKey: 'sdk_entities' },
    ],
  },
  {
    label: 'AVIATION', groupIcon: Plane,
    fullLabel: 'AVIATION',
    color: flightCom,
    layers: [
      { key: 'flights', label: 'Commercial', icon: Plane, color: flightCom, dataKey: 'commercial_flights' },
      { key: 'private', label: 'Private', icon: Plane, color: flightPriv, dataKey: 'private_flights' },
      { key: 'jets', label: 'Private Jets', icon: Plane, color: flightGov, dataKey: 'private_jets' },
      { key: 'military', label: 'Military', icon: Shield, color: flightMil, dataKey: 'military_flights' },
    ],
  },
  {
    label: 'MARITIME', groupIcon: Ship,
    fullLabel: 'MARITIME & SPACE',
    color: '#26C6DA',
    layers: [
      { key: 'maritime', label: 'Maritime / Naval', icon: Ship, color: '#26C6DA', dataKey: 'maritime_ships,maritime_ports,maritime_chokepoints' },
      { key: 'satellites', label: 'Satellites', icon: Satellite, color: '#D4AF37', dataKey: 'satellites' },
    ],
  },
  {
    label: 'SURVEIL', groupIcon: Eye,
    fullLabel: 'SURVEILLANCE',
    color: '#7E57C2',
    layers: [
      { key: 'cctv', label: 'CCTV Cameras', icon: Camera, color: '#7E57C2', dataKey: 'cameras' },
      { key: 'live_news', label: 'Live News Feeds', icon: Tv, color: '#EC407A', dataKey: 'live_feeds' },
    ],
  },
  {
    label: 'HAZARD', groupIcon: Flame,
    fullLabel: 'NATURAL HAZARDS',
    color: '#F9A825',
    layers: [
      { key: 'earthquakes', label: 'Earthquakes (24h)', icon: Activity, color: '#F9A825', dataKey: 'earthquakes' },
      { key: 'fires', label: 'Active Fires', icon: Flame, color: '#E65100', dataKey: 'fires' },
      { key: 'weather', label: 'Severe Weather', icon: CloudLightning, color: '#7E57C2', dataKey: 'weather_events' },
    ],
  },
  {
    label: 'THREAT', groupIcon: Shield,
    fullLabel: 'THREATS & INFRA',
    color: '#D32F2F',
    layers: [
      { key: 'infrastructure', label: 'Nuclear Facilities', icon: Radiation, color: '#26A69A', dataKey: 'infrastructure' },
      { key: 'global_incidents', label: 'Global Incidents', icon: AlertTriangle, color: '#D32F2F', dataKey: 'gdelt' },
      { key: 'gps_jamming', label: 'GPS Jamming', icon: Radio, color: '#D32F2F', dataKey: 'gps_jamming' },
    ],
  },
  {
    label: 'NETWORK', groupIcon: Network,
    fullLabel: 'NETWORK INTEL',
    color: '#D32F2F',
    layers: [

      { key: 'malware', label: 'Live Malware', icon: AlertTriangle, color: '#D32F2F', dataKey: 'malware_threats' },
    ],
  },
  {
    label: 'DISPLAY', groupIcon: Monitor,
    fullLabel: 'DISPLAY',
    color: '#448AFF',
    layers: [
      { key: 'day_night', label: 'Day / Night Cycle', icon: Sun, color: '#448AFF', dataKey: '' },
    ],
  },
  ];
};


function LayerPanel({ data, activeLayers, setActiveLayers, isMobile, theme = 'core', setTheme, expanded = false, onToggleExpand }: LayerPanelProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const LAYER_GROUPS = getLayerGroups(theme);
  const ALL_LAYERS = LAYER_GROUPS.flatMap(g => g.layers);

  const toggle = (key: string) => setActiveLayers((prev: any) => ({ ...prev, [key]: !prev[key] }));
  
  const getCount = (dk: string): number | null => {
    if (!dk) return null;
    let total = 0;
    let found = false;
    for (const k of dk.split(',')) {
      if (data[k] && Array.isArray(data[k])) {
        total += data[k].length;
        found = true;
      }
    }
    return found ? total : null;
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4 py-2">
        {LAYER_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <div 
              className="text-[10px] font-bold font-mono tracking-widest border-b border-white/10 pb-1"
              style={{ color: group.color }}
            >
              {group.fullLabel}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {group.layers.map((layer) => {
                const isLayerActive = activeLayers[layer.key];
                const count = getCount(layer.dataKey);
                
                return (
                  <button
                    key={layer.key}
                    onClick={() => {
                      if (layer.key === 'sdk_ransomware') {
                        
                      } else {
                        toggle(layer.key);
                      }
                    }}
                    className={`flex items-center gap-2 px-2 py-2 rounded border transition-colors ${
                      isLayerActive 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-transparent border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div 
                      className={`w-2 h-2 rounded-full border flex-shrink-0 transition-all ${
                        isLayerActive ? 'bg-current border-current scale-100' : 'bg-transparent border-white/30 scale-75'
                      }`}
                      style={{ color: isLayerActive ? layer.color : 'inherit', boxShadow: isLayerActive ? `0 0 8px ${layer.color}` : 'none' }}
                    />
                    <span className={`text-[9px] font-mono uppercase tracking-wider flex-1 text-left ${isLayerActive ? 'text-white' : 'text-white/60'}`}>
                      {layer.label}
                    </span>
                    {count !== null && (
                      <span className="text-[8px] font-mono tabular-nums opacity-60">
                        {count.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* MOBILE THEME TOGGLE */}
        {setTheme && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-primary)] px-2">
            <div className="text-[10px] font-bold font-mono tracking-widest text-[var(--text-secondary)]">
              GHOST MODE
            </div>
            <button
              onClick={() => setTheme(theme === 'core' ? 'ghost' : 'core')}
              className="relative w-12 h-6 rounded-full transition-all duration-500 ease-in-out border flex items-center px-0.5 cursor-pointer hover:shadow-lg"
              style={{
                backgroundColor: theme === 'ghost' ? 'rgba(179, 136, 255, 0.15)' : 'rgba(0,0,0,0.4)',
                borderColor: theme === 'ghost' ? 'rgba(179, 136, 255, 0.5)' : 'rgba(255,255,255,0.1)',
                boxShadow: theme === 'ghost' ? '0 0 15px rgba(179, 136, 255, 0.3), inset 0 0 8px rgba(179, 136, 255, 0.2)' : 'inset 0 0 5px rgba(0,0,0,0.5)'
              }}
            >
              <motion.div 
                layout
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: theme === 'ghost' ? '#B388FF' : 'rgba(255,255,255,0.4)',
                  boxShadow: theme === 'ghost' ? '0 0 10px #B388FF' : 'none'
                }}
                animate={{ x: theme === 'ghost' ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        )}

      </div>
    );
  }

  return (
    <>
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: expanded ? 280 : 80 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 left-0 h-full flex flex-col pt-10 pb-8 z-50 pointer-events-auto overflow-hidden"
      style={{ background: 'rgba(75,75,75,0.35)', backdropFilter: 'blur(20px) saturate(1.4)' }}
    >
      
      {/* Select All / Deselect All */}
      <div className="flex items-center justify-center gap-3 px-2 py-2 flex-shrink-0">
        <button
          onClick={() => {
            const all: Record<string, boolean> = {};
            LAYER_GROUPS.forEach(g => g.layers.forEach(l => { all[l.key] = true; }));
            setActiveLayers(prev => ({ ...prev, ...all }));
          }}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--alert-green)] transition-colors"
          title="Alle aktivieren"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button
          onClick={() => {
            const off: Record<string, boolean> = {};
            LAYER_GROUPS.forEach(g => g.layers.forEach(l => { off[l.key] = false; }));
            setActiveLayers(prev => ({ ...prev, ...off }));
          }}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--alert-red)] transition-colors"
          title="Alle deaktivieren"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {!expanded && (
      <div className="flex-1 flex flex-col gap-2 px-2 items-center overflow-y-auto">
        {LAYER_GROUPS.map((group) => {
          const groupActiveCount = group.layers.filter(l => activeLayers[l.key]).length;
          const isActive = groupActiveCount > 0;
          const isOpen = activeGroup === group.label;
          const GIcon = group.groupIcon || Target;

          return (
            <div key={group.label} className="relative flex justify-center items-center">
              {/* Group Icon Button */}
              <button
                onClick={() => { if (onToggleExpand) onToggleExpand(); }}
                className="w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all hover:bg-white/5"
                title={group.fullLabel}
              >
                {isActive && (
                  <div className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: group.color, boxShadow: `0 0 6px ${group.color}` }} />
                )}
                <GIcon className="w-5 h-5 transition-all" style={{ color: isActive || isOpen ? group.color : 'rgba(255,255,255,0.35)', filter: isActive ? `drop-shadow(0 0 4px ${group.color}80)` : 'none' }} />
                <span className="text-[6px] font-mono tracking-wider" style={{ color: isActive || isOpen ? group.color : 'rgba(255,255,255,0.3)' }}>{group.label}</span>
              </button>

            </div>
          );
        })}
      </div>
      )}

      {/* EXPANDED: full inline layer list with toggles (wie altes Script) */}
      {expanded && (
      <div className="flex-1 flex flex-col gap-4 px-3 overflow-y-auto">
        {LAYER_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <div className="text-[10px] font-bold font-mono tracking-widest border-b border-white/10 pb-1.5 mb-1" style={{ color: group.color }}>
              {group.fullLabel}
            </div>
            {group.layers.map((layer) => {
              const isLayerActive = activeLayers[layer.key];
              const count = getCount(layer.dataKey);
              const Icon = layer.icon || Shield;
              return (
                <button
                  key={layer.key}
                  onClick={() => { if (layer.key !== 'sdk_ransomware') toggle(layer.key); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-white/5 transition-colors group"
                >
                  <div
                    className={`w-2 h-2 rounded-full border flex-shrink-0 transition-all ${isLayerActive ? 'bg-current border-current' : 'bg-transparent border-white/30 scale-75'}`}
                    style={{ color: isLayerActive ? layer.color : 'inherit', boxShadow: isLayerActive ? `0 0 8px ${layer.color}` : 'none' }}
                  />
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isLayerActive ? layer.color : 'rgba(255,255,255,0.4)' }} />
                  <span className={`text-[11px] font-mono uppercase tracking-wider flex-1 text-left ${isLayerActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                    {layer.label}
                  </span>
                  {count !== null && (
                    <span className="text-[9px] font-mono tabular-nums opacity-60">{count.toLocaleString()}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      )}


    </motion.div>

    {/* Collapse / expand arrow tab (Pfeil ein-/ausklappen) */}
    {onToggleExpand && (
      <motion.button
        initial={false}
        animate={{ left: expanded ? 280 : 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={onToggleExpand}
        title={expanded ? 'Sidebar einklappen' : 'Sidebar ausklappen'}
        className="absolute top-1 z-[60] w-5 h-12 flex items-center justify-center rounded-r border border-l-0 border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--gold-primary)] pointer-events-auto transition-colors"
        style={{ background: 'rgba(75,75,75,0.5)', backdropFilter: 'blur(20px)' }}
      >
        {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </motion.button>
    )}
    </>
  );
}

export default memo(LayerPanel);
