'use client';

import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/authClient';
import LoginScreen from '@/components/LoginScreen';
import { ToastProvider } from '@/components/UiDialogs';
import { WindowManagerProvider } from '@/components/WindowManager';

function Gate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-[var(--bg-void)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--gold-primary)]" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  return <>{children}</>;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <WindowManagerProvider>
          <Gate>{children}</Gate>
        </WindowManagerProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
