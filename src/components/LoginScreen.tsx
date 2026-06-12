'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/authClient';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setError('');
    if (!username || !password) {
      setError('USERNAME & PASSWORD REQUIRED');
      return;
    }
    setBusy(true);
    const res = await login(username.trim(), password);
    setBusy(false);
    if (!res.ok) setError((res.error || 'LOGIN FAILED').toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-[var(--bg-void)] overflow-hidden select-none">
      {/* scanline / grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(var(--gold-rgb),0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--gold-rgb),0.5) 1px,transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(var(--gold-rgb),0.08), transparent 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-[360px] glass-panel p-9 flex flex-col gap-5"
        style={{ boxShadow: '0 0 60px rgba(var(--gold-rgb),0.12), 0 0 120px rgba(var(--gold-rgb),0.05)' }}
      >
        <div className="flex flex-col items-center gap-2">
          <Globe
            className="w-12 h-12 text-[var(--gold-primary)] animate-osiris-pulse"
            style={{ filter: 'drop-shadow(0 0 16px rgba(var(--gold-rgb),0.6))' }}
          />
          <div className="text-[20px] font-bold tracking-[0.5em] text-[var(--gold-primary)] font-mono">
            OSINT
          </div>
          <div className="text-[9px] tracking-[0.3em] text-[var(--text-muted)] font-mono">
            AUTHENTICATION REQUIRED
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] tracking-[0.2em] text-[var(--text-muted)] font-mono">
            USERNAME
          </label>
          <div className="flex items-center gap-2 bg-black/40 border border-[var(--border-primary)] rounded px-3 py-2 focus-within:border-[var(--gold-primary)] transition-colors">
            <User className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoComplete="username"
              className="bg-transparent outline-none w-full text-[12px] text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)]"
              placeholder="username"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] tracking-[0.2em] text-[var(--text-muted)] font-mono">
            PASSWORD
          </label>
          <div className="flex items-center gap-2 bg-black/40 border border-[var(--border-primary)] rounded px-3 py-2 focus-within:border-[var(--gold-primary)] transition-colors">
            <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoComplete="current-password"
              className="bg-transparent outline-none w-full text-[12px] text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)]"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="min-h-[14px] text-[10px] text-center text-[var(--alert-red)] font-mono tracking-wide">
          {error}
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="flex items-center justify-center gap-2 py-2.5 rounded border border-[var(--gold-primary)] bg-[rgba(var(--gold-rgb),0.1)] text-[var(--gold-primary)] text-[12px] font-mono tracking-[0.25em] hover:bg-[rgba(var(--gold-rgb),0.22)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {busy ? 'AUTHENTICATING' : 'ACCESS TERMINAL'}
        </button>

        <div className="text-[9px] text-center text-[var(--text-muted)] font-mono tracking-wide">
          OSINT · OPEN SOURCE INTELLIGENCE
        </div>
      </motion.div>
    </div>
  );
}
