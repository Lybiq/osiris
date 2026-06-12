'use client';

import { useState, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface Props {
  onDateChange: (date: string | null) => void;
}

export default function TimeTravel({ onDateChange }: Props) {
  const [active, setActive] = useState(false);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });

  const changeDate = useCallback((days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const today = new Date();
    if (d > today) return;
    const iso = d.toISOString().split('T')[0];
    setDate(iso);
    if (active) onDateChange(iso);
  }, [date, active, onDateChange]);

  const toggle = () => {
    if (active) {
      setActive(false);
      onDateChange(null);
    } else {
      setActive(true);
      onDateChange(date);
    }
  };

  return (
    <div className="flex items-center gap-2 pointer-events-auto">
      <button
        onClick={toggle}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono tracking-wider transition-all ${active ? 'bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] border border-[var(--gold-primary)]/40' : 'text-white/40 hover:text-white/60 border border-white/10'}`}
        title="Time Travel — Historische Satellitenbilder"
      >
        <Calendar className="w-3 h-3" />
        {active ? 'TIME TRAVEL' : 'HISTORY'}
      </button>

      {active && (
        <div className="flex items-center gap-1.5 glass-panel px-2 py-1 rounded">
          <button onClick={() => changeDate(-7)} className="text-white/40 hover:text-white/80 transition-colors" title="-7 Tage">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); onDateChange(e.target.value); }}
            max={new Date().toISOString().split('T')[0]}
            className="bg-transparent text-[9px] font-mono text-[var(--cyan-primary)] border-none outline-none tabular-nums w-[90px]"
          />
          <button onClick={() => changeDate(7)} className="text-white/40 hover:text-white/80 transition-colors" title="+7 Tage">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
