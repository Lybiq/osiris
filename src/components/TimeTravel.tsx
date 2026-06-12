'use client';

import { useState, useCallback, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface Props {
  onDateChange: (date: string | null) => void;
  active?: boolean;
}

export default function TimeTravel({ onDateChange, active = false }: Props) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (active) onDateChange(date);
    else onDateChange(null);
  }, [active]);

  const changeDate = useCallback((days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const today = new Date();
    if (d > today) return;
    const earliest = new Date('2012-05-01');
    if (d < earliest) return;
    const iso = d.toISOString().split('T')[0];
    setDate(iso);
    if (active) onDateChange(iso);
  }, [date, active, onDateChange]);

  if (!active) return null;

  return (
    <div className="flex items-center gap-2 pointer-events-auto">
      <div className="flex items-center gap-1 glass-panel px-2.5 py-1.5 rounded-lg">
        <Calendar className="w-3 h-3 text-[var(--gold-primary)]" />
        <span className="text-[8px] text-[var(--gold-primary)] font-mono tracking-widest">TIME TRAVEL</span>
        <span className="text-white/20 mx-1">|</span>
        <button onClick={() => changeDate(-30)} className="text-white/40 hover:text-white/80 text-[8px] font-mono" title="-30 Tage">«</button>
        <button onClick={() => changeDate(-7)} className="text-white/40 hover:text-white/80" title="-7 Tage"><ChevronLeft className="w-3 h-3" /></button>
        <input
          type="date"
          value={date}
          onChange={e => { setDate(e.target.value); onDateChange(e.target.value); }}
          max={new Date().toISOString().split('T')[0]}
          min="2012-05-01"
          className="bg-transparent text-[10px] font-mono text-[var(--cyan-primary)] border-none outline-none tabular-nums w-[95px]"
        />
        <button onClick={() => changeDate(7)} className="text-white/40 hover:text-white/80" title="+7 Tage"><ChevronRight className="w-3 h-3" /></button>
        <button onClick={() => changeDate(30)} className="text-white/40 hover:text-white/80 text-[8px] font-mono" title="+30 Tage">»</button>
        <span className="text-white/20 mx-1">|</span>
        <button onClick={() => { const d = new Date(); d.setDate(d.getDate()-1); const iso = d.toISOString().split('T')[0]; setDate(iso); onDateChange(iso); }} className="text-[7px] font-mono text-white/30 hover:text-white/60" title="Gestern">GESTERN</button>
        <button onClick={() => { onDateChange(null); }} className="text-white/30 hover:text-[var(--alert-red)] ml-1" title="Time Travel beenden"><RotateCcw className="w-3 h-3" /></button>
      </div>
      <span className="text-[7px] font-mono text-white/20">NASA MODIS · Zoom ≤ 9</span>
    </div>
  );
}
