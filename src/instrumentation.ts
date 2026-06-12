// Runs once at server startup (Next.js instrumentation hook).
// Loads persisted server API keys into process.env so all data routes
// pick them up without per-route changes.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { readKeys, applyToEnv } = await import('@/lib/apikeys');
      applyToEnv(await readKeys());
    } catch {
      /* best-effort: missing/invalid key store is non-fatal */
    }
  }
}
