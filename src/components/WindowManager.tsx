'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { GLASS_STYLE } from '@/components/LFrame';

// ── Types ──────────────────────────────────────────────
export interface WinDef {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  defaultPos?: { x: number; y: number };
  defaultSize?: { w: number; h: number };
  minSize?: { w: number; h: number };
}

interface WinState {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
  minimized: boolean;
  zIndex: number;
}

interface WmCtx {
  openWindow: (def: WinDef) => void;
  closeWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  isOpen: (id: string) => boolean;
}

const WmContext = createContext<WmCtx | null>(null);
export function useWindowManager() {
  const ctx = useContext(WmContext);
  if (!ctx) throw new Error('useWindowManager must be inside WindowManagerProvider');
  return ctx;
}

// ── Provider ───────────────────────────────────────────
export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WinState[]>([]);
  const zCounter = useRef(1000);

  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: zCounter.current } : w));
  }, []);

  const openWindow = useCallback((def: WinDef) => {
    setWindows(ws => {
      const existing = ws.find(w => w.id === def.id);
      if (existing) {
        // Restore if minimized, bring to front
        zCounter.current += 1;
        return ws.map(w => w.id === def.id ? { ...w, minimized: false, zIndex: zCounter.current, content: def.content } : w);
      }
      zCounter.current += 1;
      const offset = ws.length * 24;
      return [...ws, {
        id: def.id,
        title: def.title,
        icon: def.icon,
        content: def.content,
        x: def.defaultPos?.x ?? 100 + offset,
        y: def.defaultPos?.y ?? 80 + offset,
        w: def.defaultSize?.w ?? 420,
        h: def.defaultSize?.h ?? 340,
        minW: def.minSize?.w ?? 280,
        minH: def.minSize?.h ?? 200,
        minimized: false,
        zIndex: zCounter.current,
      }];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(ws => ws.filter(w => w.id !== id));
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setWindows(ws => ws.map(w => {
      if (w.id !== id) return w;
      if (w.minimized) {
        zCounter.current += 1;
        return { ...w, minimized: false, zIndex: zCounter.current };
      }
      return { ...w, minimized: true };
    }));
  }, []);

  const isOpen = useCallback((id: string) => windows.some(w => w.id === id), [windows]);

  const updatePos = useCallback((id: string, x: number, y: number) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const updateSize = useCallback((id: string, w: number, h: number) => {
    setWindows(ws => ws.map(win => win.id === id ? { ...win, w: Math.max(win.minW, w), h: Math.max(win.minH, h) } : win));
  }, []);

  const minimizedWindows = windows.filter(w => w.minimized);

  return (
    <WmContext.Provider value={{ openWindow, closeWindow, toggleMinimize, isOpen }}>
      {children}

      {/* ── Render windows ── */}
      <AnimatePresence>
        {windows.filter(w => !w.minimized).map(win => (
          <FloatingWindow
            key={win.id}
            win={win}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => toggleMinimize(win.id)}
            onFocus={() => bringToFront(win.id)}
            onMove={(x, y) => updatePos(win.id, x, y)}
            onResize={(w, h) => updateSize(win.id, w, h)}
          />
        ))}
      </AnimatePresence>

      {/* ── Taskbar ── */}
      {minimizedWindows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[9000] flex items-center gap-1 px-2 py-1 border-t border-white/8" style={GLASS_STYLE}>
          {minimizedWindows.map(w => (
            <button
              key={w.id}
              onClick={() => toggleMinimize(w.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:border-[var(--gold-primary)]/30 text-[10px] font-mono tracking-wider transition-colors hover:bg-white/5"
            >
              {w.icon}
              {w.title}
            </button>
          ))}
        </div>
      )}
    </WmContext.Provider>
  );
}

// ── Floating Window Component ──────────────────────────
function FloatingWindow({
  win, onClose, onMinimize, onFocus, onMove, onResize,
}: {
  win: WinState;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
}) {
  const dragging = useRef(false);
  const resizing = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0, mx: 0, my: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        onMove(e.clientX - offset.current.x, e.clientY - offset.current.y);
      }
      if (resizing.current) {
        const dw = e.clientX - startSize.current.mx;
        const dh = e.clientY - startSize.current.my;
        onResize(startSize.current.w + dw, startSize.current.h + dh);
      }
    };
    const onMouseUp = () => { dragging.current = false; resizing.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [onMove, onResize]);

  const onDragStart = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - win.x, y: e.clientY - win.y };
    onFocus();
    e.preventDefault();
  };

  const onResizeStart = (e: React.MouseEvent) => {
    resizing.current = true;
    startSize.current = { w: win.w, h: win.h, mx: e.clientX, my: e.clientY };
    onFocus();
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed overflow-hidden rounded-lg border border-white/10 flex flex-col pointer-events-auto"
      style={{
        left: win.x, top: win.y, width: win.w, height: win.h,
        zIndex: win.zIndex,
        ...GLASS_STYLE,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.05)',
      }}
      onMouseDown={onFocus}
    >
      {/* Title bar */}
      <div
        onMouseDown={onDragStart}
        className="flex items-center gap-2 px-3 py-2 border-b border-white/8 cursor-grab active:cursor-grabbing select-none flex-shrink-0"
      >
        <span className="text-[9px] font-mono tracking-[0.15em] text-[var(--text-muted)] flex-1">{win.title}</span>
        {/* Window controls (right side) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 transition-all flex items-center justify-center group" title="Minimieren">
            <Minus className="w-2 h-2 text-black/0 group-hover:text-black/70" />
          </button>
          <span className="w-3 h-3 rounded-full bg-[#28c840] opacity-50" />
          <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all flex items-center justify-center group" title="Schließen">
            <X className="w-2 h-2 text-black/0 group-hover:text-black/70" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {win.content}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10"
        style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(var(--gold-rgb),0.3) 50%)' }}
      />
    </motion.div>
  );
}
