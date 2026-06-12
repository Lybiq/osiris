'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Trash2, Shield, User as UserIcon, KeyRound, RefreshCw, Loader2, MapPin } from 'lucide-react';
import { authFetch, useAuth, type Role } from '@/lib/authClient';
import { ConfirmDialog, PromptDialog, useToast } from '@/components/UiDialogs';
import ApiKeysSection from '@/components/ApiKeysSection';
import UpdateSection from '@/components/UpdateSection';

interface ManagedUser {
  username: string;
  role: Role;
  lastLogin: string | null;
  lastIP: string | null;
  lastLoc: string | null;
  created: string | null;
}

export default function UserManagementPanel({ onClose }: { onClose: () => void }) {
  const { user: me } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'users' | 'apikeys' | 'update'>('users');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // new-user form
  const [nu, setNu] = useState('');
  const [np, setNp] = useState('');
  const [nr, setNr] = useState<Role>('user');
  const [creating, setCreating] = useState(false);

  // in-design dialogs
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; okLabel: string; danger: boolean; onOk: () => void }>(
    { open: false, title: '', message: '', okLabel: 'OK', danger: false, onOk: () => {} },
  );
  const [promptState, setPromptState] = useState<{ open: boolean; title: string; message?: string; placeholder?: string; password?: boolean; onOk: (v: string) => void }>(
    { open: false, title: '', onOk: () => {} },
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/users');
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      setUsers(await res.json());
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const createUser = async () => {
    if (!nu || !np || creating) return;
    setCreating(true);
    const res = await authFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username: nu.trim(), password: np, role: nr }),
    });
    setCreating(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Anlegen fehlgeschlagen', 'err');
      return;
    }
    toast(`Benutzer „${nu.trim()}" angelegt`);
    setNu('');
    setNp('');
    setNr('user');
    load();
  };

  const deleteUser = (username: string) => {
    setConfirmState({
      open: true,
      title: 'Benutzer löschen',
      message: `Benutzer „${username}" wirklich dauerhaft löschen?`,
      okLabel: 'LÖSCHEN',
      danger: true,
      onOk: async () => {
        setConfirmState(s => ({ ...s, open: false }));
        const res = await authFetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          toast(d.error || 'Löschen fehlgeschlagen', 'err');
          return;
        }
        toast(`„${username}" gelöscht`);
        load();
      },
    });
  };

  const toggleRole = async (u: ManagedUser) => {
    const role: Role = u.role === 'admin' ? 'user' : 'admin';
    const res = await authFetch(`/api/users/${encodeURIComponent(u.username)}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Änderung fehlgeschlagen', 'err');
      return;
    }
    toast(`„${u.username}" ist jetzt ${role}`);
    load();
  };

  const resetPassword = (username: string) => {
    setPromptState({
      open: true,
      title: `Passwort für „${username}"`,
      message: 'Neues Passwort (min. 4 Zeichen)',
      placeholder: '••••',
      password: true,
      onOk: async (pw: string) => {
        setPromptState(s => ({ ...s, open: false }));
        const res = await authFetch(`/api/users/${encodeURIComponent(username)}`, {
          method: 'PATCH',
          body: JSON.stringify({ password: pw }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          toast(d.error || 'Änderung fehlgeschlagen', 'err');
          return;
        }
        toast('Passwort aktualisiert');
      },
    });
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-panel w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* header with tabs */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
          <Shield className="w-4 h-4 text-[var(--gold-primary)]" />
          <span className="hud-text text-[13px] text-[var(--text-primary)] tracking-[0.2em] mr-2">ADMIN PANEL</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTab('users')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono tracking-wider transition-colors ${tab === 'users' ? 'bg-[var(--hover-accent)] text-[var(--gold-primary)] border border-[var(--border-active)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'}`}
            >
              USERS
            </button>
            <button
              onClick={() => setTab('apikeys')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono tracking-wider transition-colors ${tab === 'apikeys' ? 'bg-[var(--hover-accent)] text-[var(--gold-primary)] border border-[var(--border-active)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'}`}
            >
              API KEYS
            </button>
            <button
              onClick={() => setTab('update')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono tracking-wider transition-colors ${tab === 'update' ? 'bg-[var(--hover-accent)] text-[var(--gold-primary)] border border-[var(--border-active)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'}`}
            >
              UPDATE
            </button>
          </div>
          {tab === 'users' && (
            <button
              onClick={load}
              className="ml-auto p-1.5 rounded hover:bg-[var(--hover-accent)] text-[var(--text-muted)] hover:text-[var(--gold-primary)] transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className={`p-1.5 rounded hover:bg-[var(--hover-accent)] text-[var(--text-muted)] hover:text-[var(--alert-red)] transition-colors ${tab === 'users' ? '' : 'ml-auto'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {tab === 'apikeys' ? (
          <ApiKeysSection />
        ) : tab === 'update' ? (
          <UpdateSection />
        ) : (
        <>
        {/* create form */}
        <div className="px-4 py-3 border-b border-[var(--border-secondary)] flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <label className="text-[8px] tracking-[0.2em] text-[var(--text-muted)] font-mono">USERNAME</label>
            <input
              value={nu}
              onChange={e => setNu(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createUser()}
              className="bg-black/40 border border-[var(--border-primary)] rounded px-2 py-1.5 text-[11px] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--gold-primary)]"
              placeholder="new.user"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <label className="text-[8px] tracking-[0.2em] text-[var(--text-muted)] font-mono">PASSWORD</label>
            <input
              type="password"
              value={np}
              onChange={e => setNp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createUser()}
              className="bg-black/40 border border-[var(--border-primary)] rounded px-2 py-1.5 text-[11px] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--gold-primary)]"
              placeholder="••••"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] tracking-[0.2em] text-[var(--text-muted)] font-mono">ROLE</label>
            <select
              value={nr}
              onChange={e => setNr(e.target.value as Role)}
              className="bg-black/40 border border-[var(--border-primary)] rounded px-2 py-1.5 text-[11px] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--gold-primary)]"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <button
            onClick={createUser}
            disabled={creating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--gold-primary)] bg-[rgba(var(--gold-rgb),0.1)] text-[var(--gold-primary)] text-[11px] font-mono tracking-wider hover:bg-[rgba(var(--gold-rgb),0.2)] transition-all disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            ADD
          </button>
        </div>

        {/* list */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-[11px] font-mono">
              <thead className="sticky top-0 bg-[var(--bg-panel-solid)]">
                <tr className="text-[var(--text-muted)] text-left text-[9px] tracking-[0.15em]">
                  <th className="px-4 py-2 font-normal">USER</th>
                  <th className="px-2 py-2 font-normal">ROLE</th>
                  <th className="px-2 py-2 font-normal hidden sm:table-cell">LAST LOGIN</th>
                  <th className="px-2 py-2 font-normal hidden md:table-cell">IP</th>
                  <th className="px-2 py-2 font-normal hidden md:table-cell">LOCATION</th>
                  <th className="px-2 py-2 font-normal text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.username} className="border-t border-[var(--border-secondary)] hover:bg-[var(--hover-accent)]">
                    <td className="px-4 py-2 text-[var(--text-primary)]">
                      <span className="flex items-center gap-1.5">
                        {u.role === 'admin' ? (
                          <Shield className="w-3 h-3 text-[var(--gold-primary)]" />
                        ) : (
                          <UserIcon className="w-3 h-3 text-[var(--text-muted)]" />
                        )}
                        {u.username}
                        {me?.username === u.username && (
                          <span className="text-[8px] text-[var(--cyan-primary)] tracking-wider">YOU</span>
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className={u.role === 'admin' ? 'text-[var(--gold-primary)]' : 'text-[var(--text-secondary)]'}>{u.role}</span>
                    </td>
                    <td className="px-2 py-2 text-[var(--text-muted)] hidden sm:table-cell">{fmt(u.lastLogin)}</td>
                    <td className="px-2 py-2 text-[var(--text-muted)] hidden md:table-cell">{u.lastIP || '—'}</td>
                    <td className="px-2 py-2 text-[var(--text-secondary)] hidden md:table-cell">
                      <span className="flex items-center gap-1">
                        {u.lastLoc ? <MapPin className="w-3 h-3 text-[var(--cyan-primary)] flex-shrink-0" /> : null}
                        {u.lastLoc || '—'}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleRole(u)} title="Admin/User umschalten" className="p-1 rounded hover:bg-[var(--hover-accent)] text-[var(--text-muted)] hover:text-[var(--gold-primary)]">
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => resetPassword(u.username)} title="Passwort zurücksetzen" className="p-1 rounded hover:bg-[var(--hover-accent)] text-[var(--text-muted)] hover:text-[var(--cyan-primary)]">
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteUser(u.username)} disabled={me?.username === u.username} title="Benutzer löschen" className="p-1 rounded hover:bg-[var(--hover-accent)] text-[var(--text-muted)] hover:text-[var(--alert-red)] disabled:opacity-30 disabled:cursor-not-allowed">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </>
        )}
      </motion.div>

      {/* in-design dialogs (replace browser popups) */}
      <ConfirmDialog
        open={confirmState.open}
        opts={{ title: confirmState.title, message: confirmState.message, okLabel: confirmState.okLabel, danger: confirmState.danger }}
        onConfirm={confirmState.onOk}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
      <PromptDialog
        open={promptState.open}
        opts={{ title: promptState.title, message: promptState.message, placeholder: promptState.placeholder, password: promptState.password }}
        onSubmit={promptState.onOk}
        onCancel={() => setPromptState(s => ({ ...s, open: false }))}
      />
    </motion.div>
  );
}
