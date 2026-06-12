import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { execSync, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPO = process.env.OSINT_REPO_PATH || '/repo';
const DATA_DIR = process.env.OSIRIS_DATA_DIR || path.join(process.cwd(), 'data');
const STATUS_FILE = path.join(DATA_DIR, 'update-status.json');

function run(cmd: string, timeout = 30000): string {
  try {
    return execSync(cmd, { timeout, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e: unknown) {
    const err = e as { stderr?: string; message?: string };
    throw new Error(err.stderr || err.message || 'Command failed');
  }
}

async function writeStatus(status: Record<string, unknown>) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STATUS_FILE, JSON.stringify({ ...status, ts: new Date().toISOString() }, null, 2));
  } catch { /* best effort */ }
}

async function readStatus(): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await fs.readFile(STATUS_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

// GET /api/admin/update — check for available updates
export async function GET(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const status = await readStatus();

  try {
    // Check if /repo is mounted and is a git repo
    run(`git -C ${REPO} rev-parse --is-inside-work-tree`);
  } catch {
    return NextResponse.json({
      available: false,
      repoMounted: false,
      message: 'Repository nicht gemountet. Siehe Update-Anleitung.',
      status,
    });
  }

  try {
    // Ensure upstream remote
    try {
      run(`git -C ${REPO} remote get-url upstream`);
    } catch {
      run(`git -C ${REPO} remote add upstream https://github.com/simplifaisoul/osiris.git`);
    }

    run(`git -C ${REPO} fetch upstream`, 60000);
    const local = run(`git -C ${REPO} rev-parse HEAD`);
    const remote = run(`git -C ${REPO} rev-parse upstream/master`);
    const localShort = local.slice(0, 8);
    const remoteShort = remote.slice(0, 8);

    let behindCount = 0;
    if (local !== remote) {
      try {
        behindCount = parseInt(run(`git -C ${REPO} rev-list --count HEAD..upstream/master`), 10) || 0;
      } catch { behindCount = 1; }
    }

    return NextResponse.json({
      available: local !== remote,
      repoMounted: true,
      localCommit: localShort,
      remoteCommit: remoteShort,
      behindCount,
      message: local === remote ? 'Auf dem neuesten Stand.' : `${behindCount} neue Commit(s) verfügbar.`,
      status,
    });
  } catch (e) {
    return NextResponse.json({
      available: false,
      repoMounted: true,
      message: `Fehler: ${(e as Error).message}`,
      status,
    });
  }
}

// POST /api/admin/update — trigger update (async, container restarts itself)
export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    run(`git -C ${REPO} rev-parse --is-inside-work-tree`);
  } catch {
    return NextResponse.json({ error: 'Repository nicht gemountet' }, { status: 400 });
  }

  // Start the update asynchronously — the container will be replaced
  await writeStatus({ phase: 'starting', message: 'Update gestartet...' });

  // Fire and forget: the exec callback runs after we've already responded
  const updateCmd = [
    `cd ${REPO}`,
    // Ensure upstream remote
    `git remote get-url upstream 2>/dev/null || git remote add upstream https://github.com/simplifaisoul/osiris.git`,
    `git fetch upstream`,
    `git merge upstream/master --no-edit -X theirs`,
    // Apply OSINT rename patch
    `sh ${REPO}/scripts/patch-osint.sh ${REPO}`,
    `git add -A`,
    `git diff --cached --quiet || git commit -m "auto: OSINT rename patch"`,
    // Rebuild and restart (this kills the current container)
    `docker compose build --no-cache osiris`,
    `docker compose up -d osiris`,
  ].join(' && ');

  exec(updateCmd, { timeout: 600000 }, async (err) => {
    if (err) {
      await writeStatus({ phase: 'error', message: err.message });
    } else {
      await writeStatus({ phase: 'done', message: 'Update erfolgreich. Container wird neu gestartet.' });
    }
  });

  return NextResponse.json({
    ok: true,
    message: 'Update gestartet. Der Container wird nach dem Rebuild automatisch neu gestartet. Bitte warte 2-3 Minuten und lade die Seite dann neu.',
  });
}
