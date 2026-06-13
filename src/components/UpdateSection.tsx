'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Download, Loader2, Check, AlertTriangle, GitBranch } from 'lucide-react';
import { authFetch } from '@/lib/authClient';
import { useToast, ConfirmDialog } from '@/components/UiDialogs';

interface UpdateStatus {
  available: boolean;
  repoMounted: boolean;
  localCommit?: string;
  remoteCommit?: string;
  behindCount?: number;
  message: string;
  status?: { phase?: string; message?: string; ts?: string } | null;
}

export default function UpdateSection() {
  const toast = useToast();
  const [info, setInfo] = useState<UpdateStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/update');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setInfo(await res.json());
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    check();
  }, [check]);

  const triggerUpdate = async () => {
    setUpdating(true);
    setProgress({ percent: 0, cmd: 'starting', status: 'Update wird gestartet...' });
    setError(null);
    
    // Start polling progress
    const pollInterval = setInterval(async () => {
      try {
        const r = await authFetch('/api/admin/update?progress=1');
        if (r.ok) {
          const p = await r.json();
          if (p && p.percent > 0) setProgress({ percent: p.percent, cmd: p.cmd, status: p.status });
        }
      } catch {}
    }, 1500);

    try {
      const r = await authFetch('/api/admin/update', { method: 'POST' });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        setProgress({ percent: 100, cmd: 'done', status: 'Update abgeschlossen!' });
        toast('Update erfolgreich!');
      } else {
        setError(data.error || 'Update fehlgeschlagen');
        setProgress(null);
      }
    } catch (e) {
      setError((e as Error).message);
      setProgress(null);
    }
    clearInterval(pollInterval);
    setUpdating(false);
  };

  return (
    <div className="p-4 overflow-y-auto flex-1">
      <p className="text-[10px] text-[var(--text-muted)] font-mono mb-4 leading-relaxed">
        Upstream: <span className="text-[var(--cyan-primary)]">simplifaisoul/osiris</span> — Deine Anpassungen (Auth, Admin-Panel, OSINT-Umbenennung) werden beim Update automatisch per Patch beibehalten.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : !info ? (
        <div className="text-[11px] text-[var(--alert-red)] font-mono">Statusabfrage fehlgeschlagen</div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Repo status */}
          <div className="flex items-start gap-3 glass-panel p-3">
            <GitBranch className={`w-4 h-4 mt-0.5 flex-shrink-0 ${info.repoMounted ? 'text-[var(--alert-green)]' : 'text-[var(--alert-red)]'}`} />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-[var(--text-primary)]">
                {info.repoMounted ? 'Repository verbunden' : 'Repository nicht gefunden'}
              </span>
              {info.repoMounted && info.localCommit && (
                <span className="text-[9px] font-mono text-[var(--text-muted)]">
                  Lokal: <span className="text-[var(--cyan-primary)]">{info.localCommit}</span>
                  {info.remoteCommit && info.localCommit !== info.remoteCommit && (
                    <> → Upstream: <span className="text-[var(--gold-primary)]">{info.remoteCommit}</span></>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Update status */}
          <div className="flex items-start gap-3 glass-panel p-3">
            {info.available ? (
              <Download className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--gold-primary)] animate-pulse" />
            ) : (
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--alert-green)]" />
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-[var(--text-primary)]">{info.message}</span>
              {info.behindCount != null && info.behindCount > 0 && (
                <span className="text-[9px] font-mono text-[var(--gold-primary)]">
                  {info.behindCount} Commit(s) hinter upstream
                </span>
              )}
            </div>
          </div>

          {/* Last update status */}
          {info.status?.phase && (
            <div className="flex items-start gap-3 glass-panel p-3">
              {info.status.phase === 'error' ? (
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--alert-red)]" />
              ) : info.status.phase === 'done' ? (
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--alert-green)]" />
              ) : (
                <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--gold-primary)] animate-spin" />
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-[var(--text-primary)]">{info.status.message}</span>
                {info.status.ts && (
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">{new Date(info.status.ts as string).toLocaleString()}</span>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={check}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--border-primary)] text-[11px] font-mono tracking-wider text-[var(--text-secondary)] hover:bg-[var(--hover-accent)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              PRÜFEN
            </button>
            {info.available && info.repoMounted && (
              <button
                onClick={() => setConfirm(true)}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--gold-primary)] bg-[rgba(var(--gold-rgb),0.1)] text-[var(--gold-primary)] text-[11px] font-mono tracking-wider hover:bg-[rgba(var(--gold-rgb),0.2)] transition-all disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                JETZT UPDATEN
              </button>
            )}
          </div>

          {updating && (
            <div className="glass-panel p-3 border-[var(--gold-primary)]/30">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--gold-primary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Update läuft... Container wird nach dem Rebuild automatisch neu gestartet. Bitte warte 2-3 Minuten und lade die Seite dann neu.
              </div>
            </div>
          )}

          {!info.repoMounted && (
            <div className="glass-panel p-3 border-[var(--alert-red)]/30 text-[10px] font-mono text-[var(--text-muted)] leading-relaxed">
              Das Repository ist nicht im Container gemountet. Füge diese Volumes in <span className="text-[var(--cyan-primary)]">docker-compose.yml</span> hinzu:
              <pre className="mt-2 bg-black/40 rounded p-2 text-[var(--text-secondary)] overflow-x-auto">
{`volumes:
  - /var/run/docker.sock:/var/run/docker.sock
  - /opt/osint-fork:/repo`}
              </pre>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        opts={{
          title: 'Update starten',
          message: 'Upstream-Änderungen werden gemergt, der OSINT-Patch angewendet und der Container neu gebaut. Das dauert 2-3 Minuten und die Seite ist währenddessen nicht erreichbar.',
          okLabel: 'UPDATEN',
          danger: false,
        }}
        onConfirm={triggerUpdate}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
