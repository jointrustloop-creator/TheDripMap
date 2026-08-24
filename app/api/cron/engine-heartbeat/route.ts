/**
 * Engine heartbeat: notice when an engine has quietly stopped producing.
 *
 * WHY THIS EXISTS (2026-08-23). The growth engines (blog, discovery, outreach,
 * inbox triage) are Claude desktop scheduled tasks, which only fire while the
 * operator's machine is awake and the app is open. On 2026-08-23 the blog
 * engine had published nothing for SEVEN DAYS, missing both its Monday and its
 * Thursday slot, and the inbox manager had not run since 2026-08-16. Nothing
 * announced either failure. They were found by hand, a week late, while looking
 * for something else.
 *
 * THE MEASURE IS OUTPUT, NOT EXECUTION. A task that runs and produces nothing
 * is just as broken as one that never runs, and "last run" timestamps happily
 * report success for both. So every check below asks the only question that
 * matters: when did this engine last put something real into the database?
 *
 * EXCEPTIONS ONLY. Silence means healthy. An email arrives only when something
 * is actually stale, because a daily "all fine" message is a message people
 * stop reading, and this exists precisely to be noticed.
 */
import { NextResponse } from 'next/server';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

// Matches how the other cron routes type their client: the generated generics
// do not survive being handed to a helper, and narrowing them here buys nothing.
type Db = any;
import { sendMail } from '../../../../src/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

interface Engine {
  name: string;
  /** What the operator should understand this engine is for. */
  purpose: string;
  /** How many days without output before this counts as stalled. */
  staleAfterDays: number;
  /** Where its output lands, in words, so a stall report is actionable. */
  fix: string;
  lastOutput: (db: Db) => Promise<string | null>;
}

async function newest(db: Db, table: string, column: string): Promise<string | null> {
  const { data, error } = await db
    .from(table)
    .select(column)
    .not(column, 'is', null)
    .order(column, { ascending: false })
    .limit(1);
  // A read failure must not be reported as "no output ever" — that would fire a
  // false stall alarm every time Supabase hiccups.
  if (error) throw new Error(`${table}.${column}: ${error.message}`);
  const row = (data || [])[0] as Record<string, unknown> | undefined;
  const v = row ? row[column] : null;
  return v ? String(v) : null;
}

const ENGINES: Engine[] = [
  {
    name: 'Blog engine',
    purpose: 'Publishes IV-therapy guides, which are where nearly all search traffic lands.',
    staleAfterDays: 5, // cadence is Mon + Thu, so 5 days means a slot was missed
    fix: 'Scheduled task dripmap-authority-blog. It only fires while the desktop app is open.',
    lastOutput: (db: Db) => newest(db, 'blog_posts', 'date'),
  },
  {
    name: 'Discovery engine',
    purpose: 'Adds newly found clinics, which is the only thing that refills outreach supply.',
    staleAfterDays: 10, // weekly cadence with slack
    fix: 'Scheduled task dripmap-discovery-refuel, plus /api/cron/discovery.',
    lastOutput: (db: Db) => newest(db, 'providers', 'created_at'),
  },
  {
    name: 'Outreach sending',
    purpose: 'The clinic conversations that turn listings into claims.',
    staleAfterDays: 4,
    fix: 'Send a batch from /admin/outreach. Needs OUTREACH_SEND_ENABLED=true in Vercel AND a redeploy.',
    lastOutput: async (db: Db) => {
      const [a, b] = await Promise.all([
        newest(db, 'providers', 'outreach_sent_at'),
        newest(db, 'providers', 'followup_sent_at'),
      ]);
      if (!a) return b;
      if (!b) return a;
      return a > b ? a : b;
    },
  },
  {
    name: 'SEO crawl',
    purpose: 'Catches broken pages and unexpected noindex before Google does.',
    staleAfterDays: 3,
    fix: 'Vercel cron /api/cron/seo-health. A stall here means the cron itself is failing.',
    // started_at, not created_at: this table has no created_at and the first
    // draft of this file assumed one, which surfaced as "could not check"
    // rather than a false pass. That is the intended failure direction.
    lastOutput: (db: Db) => newest(db, 'seo_health_runs', 'started_at'),
  },
];

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    // Vercel cron sends the secret; allow its own header form too.
    if (auth !== `Bearer ${secret}` && req.headers.get('x-vercel-cron') === null) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const now = Date.now();
  const results: Array<{ name: string; lastOutput: string | null; daysSince: number | null; stalled: boolean; error?: string; purpose: string; fix: string }> = [];

  for (const e of ENGINES) {
    try {
      const last = await e.lastOutput(db);
      const daysSince = last ? Math.floor((now - new Date(last).getTime()) / DAY) : null;
      results.push({
        name: e.name,
        lastOutput: last,
        daysSince,
        // Never produced anything at all is also a stall, not a pass.
        stalled: daysSince === null || daysSince > e.staleAfterDays,
        purpose: e.purpose,
        fix: e.fix,
      });
    } catch (err) {
      // A read error is reported as an error, never as a stall: crying wolf on a
      // transient DB blip is how a monitor gets ignored.
      results.push({
        name: e.name, lastOutput: null, daysSince: null, stalled: false,
        error: err instanceof Error ? err.message : String(err),
        purpose: e.purpose, fix: e.fix,
      });
    }
  }

  const stalled = results.filter((r) => r.stalled);
  const errored = results.filter((r) => r.error);

  if (stalled.length || errored.length) {
    const lines: string[] = [];
    lines.push(`TheDripMap engine heartbeat — ${new Date().toISOString().slice(0, 10)}`);
    lines.push('');
    lines.push('An engine stops producing silently. This is the only thing that says so.');
    lines.push('');
    for (const r of stalled) {
      lines.push(`STALLED: ${r.name}`);
      lines.push(`  ${r.purpose}`);
      lines.push(`  Last output: ${r.lastOutput ? `${r.lastOutput.slice(0, 10)} (${r.daysSince} days ago)` : 'never'}`);
      lines.push(`  ${r.fix}`);
      lines.push('');
    }
    for (const r of errored) {
      lines.push(`COULD NOT CHECK: ${r.name} — ${r.error}`);
      lines.push('');
    }
    const healthy = results.filter((r) => !r.stalled && !r.error);
    if (healthy.length) {
      lines.push('Producing normally:');
      for (const r of healthy) lines.push(`  ${r.name}: last output ${r.daysSince} day(s) ago`);
    }
    lines.push('');
    lines.push('— TheDripMap automation');

    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: `[TheDripMap] ${stalled.length} engine${stalled.length === 1 ? '' : 's'} stalled`,
      text: lines.join('\n'),
    });
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString(), stalled: stalled.length, results });
}
