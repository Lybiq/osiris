'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Save, Keyboard, RotateCcw } from 'lucide-react';
import { authFetch } from '@/lib/authClient';
import { useToast } from '@/components/UiDialogs';

interface HotkeyDef {
  id: string;
  label: string;
  description: string;
  defaultKey: string;
  key?: string;
}

export default function HotkeysSection() {
  const toast = useToast();
  const [hotkeys, setHotkeys] = useState<HotkeyDef[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch('/api/admin/hotkeys');
      if (r.ok) {
        const data: HotkeyDef[] = await r.json();
        setHotkeys(data);
        const ov: Record<string, string> = {};
        data.forEach(h => { if (h.key && h.key !== h.defaultKey) ov[h.id] = h.key; });
        setOverrides(ov);
      }
    } catch (e) { toast((e as Error).message, 'err'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Record a keystroke
  useEffect(() => {
    if (!recording) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Meta');
      if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      }
      if (parts.length > 0) {
        const combo = parts.join('+');
        setOverrides(prev => ({ ...prev, [recording]: combo }));
        setRecording(null);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [recording]);

  const save = async () => {
    setSaving(true);
    const r = await authFetch('/api/admin/hotkeys', { method: 'POST', body: JSON.stringify({ hotkeys: overrides }) });
    setSaving(false);
    if (r.ok) toast('Hotkeys gespeichert');
    else toast('Fehler', 'err');
  };

  const resetAll = () => {
    setOverrides({});
    toast('Auf Standard zurückgesetzt — noch speichern');
  };

  return (
    <div className="p-4 overflow-y-auto flex-1 text-[10px] font-mono">
      <p className="text-white/30 mb-3">Tastenkürzel konfigurieren. Klicke auf ein Kürzel und drücke die neue Taste.</p>

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {hotkeys.map(h => {
            const currentKey = overrides[h.id] || h.defaultKey;
            const isCustom = overrides[h.id] && overrides[h.id] !== h.defaultKey;
            const isRecordingThis = recording === h.id;
            return (
              <div key={h.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/5">
                <Keyboard className="w-3 h-3 text-white/30 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-white/70">{h.label}</span>
                  <span className="text-white/25 ml-2">{h.description}</span>
                </div>
                <button
                  onClick={() => setRecording(isRecordingThis ? null : h.id)}
                  className={`px-2 py-0.5 rounded border text-[9px] tracking-wider transition-all min-w-[60px] text-center ${
                    isRecordingThis ? 'border-[var(--cyan-primary)] text-[var(--cyan-primary)] bg-[var(--cyan-primary)]/10 animate-pulse'
                    : isCustom ? 'border-[var(--gold-primary)]/50 text-[var(--gold-primary)] bg-[var(--gold-primary)]/10'
                    : 'border-white/15 text-white/50 hover:border-white/30'
                  }`}
                >
                  {isRecordingThis ? '...' : currentKey}
                </button>
              </div>
            );
          })}

          <div className="flex gap-2 mt-3 pt-3 border-t border-white/8">
            <button onClick={save} disabled={saving} className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--gold-primary)]/50 text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 hover:bg-[var(--gold-primary)]/20 disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} SPEICHERN
            </button>
            <button onClick={resetAll} className="flex items-center gap-1 px-2 py-1 rounded border border-white/15 text-white/40 hover:text-white/70 hover:bg-white/5">
              <RotateCcw className="w-3 h-3" /> STANDARD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
