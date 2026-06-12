'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/authClient';
import { LOGIN_I18N, LANG_LABELS, type Lang } from '@/lib/i18n';
import { GLASS_STYLE } from '@/components/LFrame';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<Lang>('de');

  const t = LOGIN_I18N[lang];
  const isRtl = lang === 'ar' || lang === 'fa';

  const submit = async () => {
    if (busy) return;
    setError('');
    if (!username || !password) { setError(t.credsMissing); return; }
    setBusy(true);
    const res = await login(username.trim(), password);
    setBusy(false);
    if (!res.ok) setError((res.error || t.loginFailed).toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center overflow-hidden select-none" style={{ background: 'var(--bg-void)' }} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Grid backdrop */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(212,175,55,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.4) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(212,175,55,0.06), transparent 60%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-[360px] rounded-lg border border-white/10 p-8 flex flex-col gap-5"
        style={{ ...GLASS_STYLE, boxShadow: '0 0 60px rgba(212,175,55,0.08)' }}
      >
        {/* Language selector */}
        <div className="flex justify-center gap-1.5 mb-1">
          {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-[11px] px-2 py-1 rounded transition-all ${lang === l ? 'bg-white/12 border border-[var(--gold-primary)]/40 scale-105' : 'opacity-50 hover:opacity-80 border border-transparent'}`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>

        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <Globe className="w-10 h-10 text-[var(--gold-primary)]" style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }} />
          <div className="text-[18px] font-bold tracking-[0.5em] text-[var(--gold-primary)] font-mono">OSINT</div>
          <div className="text-[8px] tracking-[0.25em] text-white/30 font-mono">{t.authRequired}</div>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] tracking-[0.2em] text-white/40 font-mono">{t.username}</label>
          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded px-3 py-2 focus-within:border-[var(--gold-primary)]/60 transition-colors">
            <User className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="username" className="bg-transparent outline-none w-full text-[12px] text-white/90 font-mono placeholder:text-white/20" placeholder={t.usernamePh} />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] tracking-[0.2em] text-white/40 font-mono">{t.password}</label>
          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded px-3 py-2 focus-within:border-[var(--gold-primary)]/60 transition-colors">
            <Lock className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="current-password" className="bg-transparent outline-none w-full text-[12px] text-white/90 font-mono placeholder:text-white/20" placeholder={t.passwordPh} />
          </div>
        </div>

        {/* Error */}
        <div className="min-h-[14px] text-[9px] text-center text-red-400 font-mono tracking-wide">{error}</div>

        {/* Submit */}
        <button onClick={submit} disabled={busy} className="flex items-center justify-center gap-2 py-2.5 rounded border border-[var(--gold-primary)]/60 bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] text-[11px] font-mono tracking-[0.2em] hover:bg-[var(--gold-primary)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {busy ? t.loginBusy : t.login}
        </button>

        {/* Footer */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] text-white/25 font-mono tracking-wide">{t.brand}</span>
          <span className="text-[7px] text-white/15 font-mono">
            {t.copyright} {new Date().getFullYear()}{' '}
            <a href="https://9rn.de" target="_blank" rel="noopener" className="text-[var(--cyan-primary)]/40 hover:text-[var(--cyan-primary)]/70 transition-colors">9rn.de</a>
            {' · '}
            <a href="mailto:L@9rn.de" className="text-white/20 hover:text-[var(--cyan-primary)]/50 transition-colors">L@9rn.de</a>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
