'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { authFetch } from '@/lib/authClient';

interface ApiStatus {
  name: string;
  status: 'ok' | 'error' | 'warn' | 'unknown';
  message: string;
  ts: string;
}

interface LogEntry {
  ts: string;
  api: string;
  message: string;
  level: 'error' | 'warn' | 'info';
}

// Built-in health checks for common endpoints
const HEALTH_CHECKS: { name: string; url: string; timeout?: number }[] = [
  { name: 'Backend', url: '/api/health' },
  { name: 'OpenSky (Flights)', url: '/api/flights?check=1', timeout: 8000 },
  { name: 'Earthquakes (USGS)', url: '/api/earthquakes?check=1', timeout: 8000 },
  { name: 'CCTV Cameras', url: '/api/cctv?check=1', timeout: 8000 },
  { name: 'Maritime (Ships)', url: '/api/maritime?check=1', timeout: 10000 },
  { name: 'Fires (FIRMS)', url: '/api/fires?check=1', timeout: 10000 },
  { name: 'Weather', url: '/api/weather?check=1', timeout: 8000 },
  { name: 'Malware Feeds', url: '/api/malware?check=1', timeout: 8000 },
  { name: 'Satellites (N2YO)', url: '/api/satellites?check=1', timeout: 8000 },
  { name: 'News (GDELT)', url: '/api/gdelt?check=1', timeout: 8000 },
];

export default function SystemHealthContent() {
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [checking, setChecking] = useState(false);

  const runChecks = useCallback(async () => {
    setChecking(true);
    const results: ApiStatus[] = [];
    const newLog: LogEntry[] = [];
    const now = new Date().toISOString();

    for (const check of HEALTH_CHECKS) {
      try {
        const ctrl = AbortSignal.timeout(check.timeout || 8000);
        const r = await fetch(check.url, { signal: ctrl });
        if (r.ok) {
          results.push({ name: check.name, status: 'ok', message: `HTTP ${r.status}`, ts: now });
        } else {
          results.push({ name: check.name, status: r.status === 401 || r.status === 403 ? 'warn' : 'error', message: `HTTP ${r.status}`, ts: now });
          newLog.push({ ts: now, api: check.name, message: `HTTP ${r.status} — ${r.statusText}`, level: 'error' });
        }
      } catch (e) {
        const msg = (e as Error).message?.includes('timeout') ? 'Timeout' : (e as Error).message || 'Error';
        results.push({ name: check.name, status: 'error', message: msg, ts: now });
        newLog.push({ ts: now, api: check.name, message: msg, level: 'error' });
      }
    }

    // Also try API keys test if admin
    try {
      const r = await authFetch('/api/apikeys/test', { method: 'POST' });
      if (r.ok) {
        const keyResults = await r.json();
        for (const kr of keyResults) {
          if (kr.status === 'ok' || kr.status === 'skip') continue;
          results.push({ name: `Key: ${kr.label}`, status: kr.status === 'auth' ? 'warn' : 'error', message: kr.message, ts: now });
          newLog.push({ ts: now, api: `Key: ${kr.label}`, message: kr.message, level: kr.status === 'auth' ? 'warn' : 'error' });
        }
      }
    } catch { /* non-admin or network error — skip */ }

    // Sort: errors first, then warnings, then ok
    results.sort((a, b) => {
      const order = { error: 0, warn: 1, unknown: 2, ok: 3 };
      return (order[a.status] ?? 2) - (order[b.status] ?? 2);
    });

    setStatuses(results);
    setLog(prev => [...newLog, ...prev].slice(0, 50));
    setChecking(false);
  }, []);

  useEffect(() => { runChecks(); }, [runChecks]);

  const errorCount = statuses.filter(s => s.status === 'error').length;
  const warnCount = statuses.filter(s => s.status === 'warn').length;

  return (
    <div className="p-3 flex flex-col gap-3 text-[10px] font-mono h-full">
      {/* Summary + refresh */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--text-muted)] tracking-wider">
          {errorCount > 0 ? <span className="text-[var(--alert-red)]">{errorCount} FEHLER</span> : null}
          {warnCount > 0 ? <span className="text-[var(--gold-primary)] ml-2">{warnCount} WARNUNG</span> : null}
          {errorCount === 0 && warnCount === 0 && !checking ? <span className="text-[var(--alert-green)]">ALLE SYSTEME OK</span> : null}
        </span>
        <button onClick={runChecks} disabled={checking} className="ml-auto p-1 rounded hover:bg-[var(--hover-accent)] text-[var(--text-muted)] hover:text-[var(--gold-primary)] disabled:opacity-50">
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* API Status list */}
      <div className="flex flex-col gap-1">
        {statuses.map(s => (
          <div key={s.name} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--hover-accent)]">
            {s.status === 'ok' ? <CheckCircle className="w-3 h-3 text-[var(--alert-green)] flex-shrink-0" /> :
             s.status === 'warn' ? <AlertTriangle className="w-3 h-3 text-[var(--gold-primary)] flex-shrink-0" /> :
             s.status === 'error' ? <XCircle className="w-3 h-3 text-[var(--alert-red)] flex-shrink-0" /> :
             <MinusCircle className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />}
            <span className="flex-1 text-[var(--text-secondary)]">{s.name}</span>
            <span className={s.status === 'ok' ? 'text-[var(--alert-green)]' : s.status === 'warn' ? 'text-[var(--gold-primary)]' : s.status === 'error' ? 'text-[var(--alert-red)]' : 'text-[var(--text-muted)]'}>
              {s.message}
            </span>
          </div>
        ))}
        {checking && statuses.length === 0 && (
          <div className="flex items-center justify-center py-6 text-[var(--text-muted)]"><Loader2 className="w-5 h-5 animate-spin" /></div>
        )}
      </div>

      {/* Error Log */}
      {log.length > 0 && (
        <div className="mt-auto border-t border-[var(--border-secondary)] pt-2">
          <div className="text-[8px] tracking-widest text-[var(--text-muted)] mb-1">ERROR LOG</div>
          <div className="max-h-[120px] overflow-y-auto flex flex-col gap-0.5">
            {log.map((l, i) => (
              <div key={i} className="flex gap-2 text-[9px]">
                <span className="text-[var(--text-muted)] flex-shrink-0">{new Date(l.ts).toLocaleTimeString()}</span>
                <span className={l.level === 'error' ? 'text-[var(--alert-red)]' : 'text-[var(--gold-primary)]'}>{l.api}</span>
                <span className="text-[var(--text-secondary)]">{l.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Returns the overall system status for the indicator light. */
export function useSystemHealth() {
  const [status, setStatus] = useState<'ok' | 'warn' | 'error' | 'checking'>('checking');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
        if (!cancelled) setStatus(r.ok ? 'ok' : 'error');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    check();
    const iv = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  return status;
}
