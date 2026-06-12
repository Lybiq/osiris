'use client';

import { useEffect, useState, useCallback } from 'react';
import { KeyRound, Loader2, Save, Check } from 'lucide-react';
import { authFetch } from '@/lib/authClient';
import { useToast } from '@/components/UiDialogs';

interface KeyInfo {
  env: string;
  label: string;
  hint: string;
  secret: boolean;
  set: boolean;
  preview: string;
  fromEnv: boolean;
}

export default function ApiKeysSection() {
  const toast = useToast();
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/apikeys');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setKeys(await res.json());
      setEdits({});
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (saving) return;
    const values = Object.fromEntries(Object.entries(edits).filter(([, v]) => v !== undefined));
    if (Object.keys(values).length === 0) {
      toast('Keine Änderungen', 'err');
      return;
    }
    setSaving(true);
    const res = await authFetch('/api/apikeys', { method: 'POST', body: JSON.stringify({ values }) });
    setSaving(false);
    if (!res.ok) {
      toast((await res.json().catch(() => ({}))).error || 'Speichern fehlgeschlagen', 'err');
      return;
    }
    toast('API-Keys gespeichert');
    load();
  };

  return (
    <div className="p-4 overflow-y-auto flex-1">
      <p className="text-[10px] text-[var(--text-muted)] font-mono mb-4 leading-relaxed">
        Server-seitige API-Keys für die Datenquellen. Gespeicherte Keys wirken sofort, ohne Neustart.
        Felder mit „aus .env" sind über die Umgebungsdatei gesetzt und hier nur informativ.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {keys.map(k => (
            <div key={k.env} className="flex flex-col gap-1.5 border-b border-[var(--border-secondary)] pb-3 last:border-0">
              <div className="flex items-center gap-2">
                <KeyRound className={`w-3.5 h-3.5 ${k.set ? 'text-[var(--alert-green)]' : 'text-[var(--text-muted)]'}`} />
                <span className="text-[11px] font-mono text-[var(--text-primary)] tracking-wide">{k.label}</span>
                {k.set && (
                  <span className="flex items-center gap-1 text-[8px] font-mono text-[var(--alert-green)] tracking-wider">
                    <Check className="w-2.5 h-2.5" /> {k.fromEnv ? 'AUS .ENV' : 'GESETZT'} {k.preview}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-[var(--text-muted)] font-mono">{k.hint}</span>
              <input
                type={k.secret ? 'password' : 'text'}
                value={edits[k.env] ?? ''}
                onChange={e => setEdits(s => ({ ...s, [k.env]: e.target.value }))}
                placeholder={k.set ? 'Neuen Wert eingeben (leer lassen = unverändert)' : 'Key eingeben…'}
                className="bg-black/40 border border-[var(--border-primary)] rounded px-2 py-1.5 text-[11px] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--gold-primary)]"
              />
              {k.set && !k.fromEnv && (
                <button
                  onClick={() => setEdits(s => ({ ...s, [k.env]: '' }))}
                  className="self-start text-[8px] font-mono text-[var(--alert-red)]/80 hover:text-[var(--alert-red)] tracking-wider"
                >
                  ✕ Beim Speichern löschen
                </button>
              )}
            </div>
          ))}

          <button
            onClick={save}
            disabled={saving}
            className="self-start mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--gold-primary)] bg-[rgba(var(--gold-rgb),0.1)] text-[var(--gold-primary)] text-[11px] font-mono tracking-wider hover:bg-[rgba(var(--gold-rgb),0.2)] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            SPEICHERN
          </button>
        </div>
      )}
    </div>
  );
}
