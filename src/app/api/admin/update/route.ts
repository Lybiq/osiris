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
// Progress polling
async function getProgress() {
  const { promises: fs } = require('fs');
  const path = require('path');
  const progressFile = path.join(process.env.OSIRIS_DATA_DIR || path.join(process.cwd(), 'data'), 'update-progress.json');
  try { return JSON.parse(await fs.readFile(progressFile, 'utf-8')); }
  catch { return null; }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('progress') === '1') {
    const p = await getProgress();
    return NextResponse.json(p || { step: 0, total: 0, percent: 0, cmd: '', status: 'idle' });
  }

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
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const gitCfg = await readGitConfig();
  const { promises: fs } = require('fs');
  const { execSync } = require('child_process');
  const path = require('path');
  const progressFile = path.join(process.env.OSIRIS_DATA_DIR || path.join(process.cwd(), 'data'), 'update-progress.json');
  
  const writeProgress = async (step: number, total: number, cmd: string, status: string) => {
    try { await fs.mkdir(path.dirname(progressFile), { recursive: true }); } catch {}
    await fs.writeFile(progressFile, JSON.stringify({ step, total, percent: Math.round((step / total) * 100), cmd, status, ts: Date.now() }));
  };

  const steps = [
    { cmd: 'git config', label: 'Git-Identität setzen...' },
    { cmd: 'git fetch', label: 'Upstream abrufen...' },
    { cmd: 'git merge', label: 'Änderungen zusammenführen...' },
    { cmd: 'patch', label: 'OSINT-Patch anwenden...' },
    { cmd: 'git commit', label: 'Änderungen committen...' },
    { cmd: 'docker build', label: 'Docker-Image bauen...' },
    { cmd: 'docker restart', label: 'Container neustarten...' },
  ];

  try {
    const repoDir = '/repo';
    const opts = { cwd: repoDir, timeout: 300000, encoding: 'utf-8' as const };

    // Step 1: Git config
    await writeProgress(1, 7, 'git config', steps[0].label);
    execSync(`git config user.email "${gitCfg.userEmail}" && git config user.name "${gitCfg.userName}"`, opts);

    // Step 2: Fetch
    await writeProgress(2, 7, 'git fetch', steps[1].label);
    execSync('git remote add upstream https://github.com/simplifaisoul/osiris.git 2>/dev/null || true', opts);
    execSync('git fetch upstream', opts);

    // Step 3: Merge
    await writeProgress(3, 7, 'git merge', steps[2].label);
    execSync('git merge upstream/master --no-edit -X theirs', opts);

    // Step 4: Patch
    await writeProgress(4, 7, 'patch-osint.sh', steps[3].label);
    try { execSync('sh /repo/scripts/patch-osint.sh /repo', opts); } catch {}

    // Step 5: Commit
    await writeProgress(5, 7, 'git commit', steps[4].label);
    execSync('git add -A', opts);
    try { execSync('git diff --cached --quiet || git commit -m "auto: OSINT rename patch"', opts); } catch {}

    // Step 6: Docker build
    await writeProgress(6, 7, 'docker build', steps[5].label);
    execSync('docker compose build --no-cache osiris', { ...opts, timeout: 600000 });

    // Step 7: Restart
    await writeProgress(7, 7, 'docker restart', steps[6].label);
    execSync('docker compose up -d osiris', opts);

    await writeProgress(7, 7, 'done', 'Update abgeschlossen!');
    return NextResponse.json({ ok: true, message: 'Update erfolgreich!' });
  } catch (e: any) {
    const msg = e?.stderr || e?.stdout || e?.message || 'Unknown error';
    await writeProgress(0, 7, 'error', msg.slice(0, 500));
    return NextResponse.json({ ok: false, error: msg.slice(0, 500) }, { status: 500 });
  }
}


// Save git config
export async function PATCH(req: Request) {
  const user = await requireAuth(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const { userName, userEmail } = await req.json();
  if (!userName || !userEmail) return NextResponse.json({ error: 'userName and userEmail required' }, { status: 400 });
  await writeGitConfig({ userName, userEmail });
  // Apply immediately
  try {
    const { execSync } = require('child_process');
    execSync(`cd /repo && git config user.email "${userEmail}" && git config user.name "${userName}"`, { timeout: 5000 });
  } catch {}
  return NextResponse.json({ ok: true, userName, userEmail });
}
