'use client';

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

// ── Confirm dialog ─────────────────────────────────────
interface ConfirmOpts {
  title: string;
  message: string;
  okLabel?: string;
  danger?: boolean;
}
export function ConfirmDialog({
  open,
  opts,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  opts: ConfirmOpts;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.96, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            className="glass-panel w-full max-w-sm p-5 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${opts.danger ? 'text-[var(--alert-red)]' : 'text-[var(--gold-primary)]'}`} />
              <span className="hud-text text-[13px] text-[var(--text-primary)] tracking-[0.15em]">{opts.title}</span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] font-mono leading-relaxed">{opts.message}</p>
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded border border-[var(--border-primary)] text-[11px] font-mono tracking-wider text-[var(--text-secondary)] hover:bg-[var(--hover-accent)] transition-colors"
              >
                ABBRECHEN
              </button>
              <button
                onClick={onConfirm}
                className={`px-3 py-1.5 rounded border text-[11px] font-mono tracking-wider transition-colors ${
                  opts.danger
                    ? 'border-[var(--alert-red)] text-[var(--alert-red)] hover:bg-[var(--alert-red)]/15'
                    : 'border-[var(--gold-primary)] text-[var(--gold-primary)] hover:bg-[rgba(var(--gold-rgb),0.18)]'
                }`}
              >
                {opts.okLabel || 'OK'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Prompt dialog (text/password input) ────────────────
interface PromptOpts {
  title: string;
  message?: string;
  placeholder?: string;
  password?: boolean;
  okLabel?: string;
}
export function PromptDialog({
  open,
  opts,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  opts: PromptOpts;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');
  return (
    <AnimatePresence onExitComplete={() => setValue('')}>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.96, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            className="glass-panel w-full max-w-sm p-5 flex flex-col gap-3"
            onClick={e => e.stopPropagation()}
          >
            <span className="hud-text text-[13px] text-[var(--text-primary)] tracking-[0.15em]">{opts.title}</span>
            {opts.message && <p className="text-[11px] text-[var(--text-muted)] font-mono">{opts.message}</p>}
            <input
              autoFocus
              type={opts.password ? 'password' : 'text'}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && value) onSubmit(value);
                if (e.key === 'Escape') onCancel();
              }}
              placeholder={opts.placeholder}
              className="bg-black/40 border border-[var(--border-primary)] rounded px-3 py-2 text-[12px] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--gold-primary)]"
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded border border-[var(--border-primary)] text-[11px] font-mono tracking-wider text-[var(--text-secondary)] hover:bg-[var(--hover-accent)] transition-colors"
              >
                ABBRECHEN
              </button>
              <button
                onClick={() => value && onSubmit(value)}
                disabled={!value}
                className="px-3 py-1.5 rounded border border-[var(--gold-primary)] text-[11px] font-mono tracking-wider text-[var(--gold-primary)] hover:bg-[rgba(var(--gold-rgb),0.18)] transition-colors disabled:opacity-40"
              >
                {opts.okLabel || 'OK'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Toast ──────────────────────────────────────────────
interface Toast { id: number; msg: string; kind: 'ok' | 'err'; }
const ToastCtx = createContext<{ toast: (msg: string, kind?: 'ok' | 'err') => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-9 left-1/2 -translate-x-1/2 z-[30000] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`px-4 py-2 rounded border text-[11px] font-mono tracking-wide backdrop-blur-md ${
                t.kind === 'err'
                  ? 'border-[var(--alert-red)] text-[var(--alert-red)] bg-[var(--alert-red)]/10'
                  : 'border-[var(--gold-primary)] text-[var(--gold-primary)] bg-[rgba(var(--gold-rgb),0.1)]'
              }`}
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  // Fallback: if no provider mounted, no-op (keeps components robust)
  return ctx?.toast ?? (() => {});
}
