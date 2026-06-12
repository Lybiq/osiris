'use client';

import { useEffect, useState, useCallback } from 'react';
import { KeyRound, Loader2, Save, Check, Zap, AlertTriangle, XCircle, MinusCircle, ExternalLink } from 'lucide-react';
import { authFetch } from '@/lib/authClient';
import { useToast } from '@/components/UiDialogs';

interface KeyInfo {
  env: string;
  label: string;
  hint: string;
  secret: boolean;
  section: string;
  registerUrl: string | null;
  pair: string | null;
  pair: string | null;
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
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{env:string;label:string;status:string;message:string;ms?:number}[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/apikeys');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setKeys(await res.json());
      setEdits({});
    } catch (e) { toast((e as Error).message, 'err'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (saving) return;
    const values = Object.fromEntries(Object.entries(edits).filter(([, v]) => v !== undefined));
    if (!Object.keys(values).length) { toast('Keine Änderungen', 'err'); return; }
    setSaving(true);
    const res = await authFetch('/api/apikeys', { method: 'POST', body: JSON.stringify({ values }) });
    setSaving(false);
    if (!res.ok) { toast((await res.json().catch(() => ({}))).error || 'Fehler', 'err'); return; }
    toast('API-Keys gespeichert');
    load();
  };

  // Group by section
  const sections = keys.reduce<Record<string, KeyInfo[]>>((acc, k) => {
    (acc[k.section] ??= []).push(k);
    return acc;
  }, {});

  return (
    <div className="p-4 overflow-y-auto flex-1">
      <p className="text-[10px] text-[var(--text-muted)] font-mono mb-4 leading-relaxed">
        Server-seitige API-Keys. Gespeicherte Keys wirken sofort ohne Neustart.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-[var(--text-muted)]"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(sections).map(([section, sectionKeys]) => (
            <div key={section}>
              <div className="text-[10px] font-mono font-bold tracking-widest text-[var(--gold-primary)] border-b border-[var(--border-secondary)] pb-1 mb-2">{section}</div>
              <div className="flex flex-col gap-3">
                {sectionKeys.map(k => (
                  <div key={k.env} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <KeyRound className={`w-3 h-3 ${k.set ? 'text-[var(--alert-green)]' : 'text-[var(--text-muted)]'}`} />
                      <span className="text-[11px] font-mono text-[var(--text-primary)] tracking-wide">{k.label}</span>
                      {k.set && (
                        <span className="flex items-center gap-0.5 text-[8px] font-mono text-[var(--alert-green)] tracking-wider">
                          <Check className="w-2.5 h-2.5" /> {k.fromEnv ? '.ENV' : 'SET'} {k.preview}
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] text-[var(--text-muted)] font-mono ml-5">{k.hint}</span>
                    <input
                      type={k.secret ? 'password' : 'text'}
                      value={edits[k.env] ?? ''}
                      onChange={e => setEdits(s => ({ ...s, [k.env]: e.target.value }))}
                      placeholder={k.set ? 'Neuen Wert (leer = unverändert)' : 'Key eingeben…'}
                      className="ml-5 bg-black/40 border border-[var(--border-primary)] rounded px-2 py-1 text-[10px] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--gold-primary)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--gold-primary)] bg-[rgba(var(--gold-rgb),0.1)] text-[var(--gold-primary)] text-[11px] font-mono tracking-wider hover:bg-[rgba(var(--gold-rgb),0.2)] transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              SPEICHERN
            </button>
            <button
              onClick={async () => {
                setTesting(true); setTestResults([]);
                try {
                  const res = await authFetch('/api/apikeys/test', { method: 'POST' });
                  if (res.ok) setTestResults(await res.json());
                  else toast('Test fehlgeschlagen', 'err');
                } catch { toast('Netzwerkfehler', 'err'); }
                finally { setTesting(false); }
              }}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--cyan-primary)] bg-[rgba(var(--cyan-primary),0.1)]/10 text-[var(--cyan-primary)] text-[11px] font-mono tracking-wider hover:bg-[rgba(var(--cyan-primary),0.2)]/20 transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              ALLE TESTEN
            </button>
          </div>

          {/* Test results */}
          {testResults.length > 0 && (
            <div className="mt-3 border-t border-[var(--border-secondary)] pt-3 flex flex-col gap-1">
              <div className="text-[9px] font-mono font-bold tracking-widest text-[var(--text-muted)] mb-1">TEST ERGEBNISSE</div>
              {testResults.map(r => (
                <div key={r.env} className="flex items-center gap-2 text-[10px] font-mono">
                  {r.status === 'ok' ? <Check className="w-3 h-3 text-[var(--alert-green)]" /> :
                   r.status === 'skip' ? <MinusCircle className="w-3 h-3 text-[var(--text-muted)]" /> :
                   r.status === 'auth' ? <AlertTriangle className="w-3 h-3 text-[var(--gold-primary)]" /> :
                   <XCircle className="w-3 h-3 text-[var(--alert-red)]" />}
                  <span className="w-[100px] text-[var(--text-secondary)] flex-shrink-0">{r.label}</span>
                  <span className={r.status === 'ok' ? 'text-[var(--alert-green)]' : r.status === 'skip' ? 'text-[var(--text-muted)]' : r.status === 'auth' ? 'text-[var(--gold-primary)]' : 'text-[var(--alert-red)]'}>
                    {r.message}
                  </span>
                  {r.ms ? <span className="text-[var(--text-muted)] text-[8px] ml-auto">{r.ms}ms</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
