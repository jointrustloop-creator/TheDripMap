// Layer A baseline storage + diff.
//
// The baseline is a small JSON file at scripts/seo-health-baseline.json that
// records the issues observed on the last successful crawl. We persist via the
// filesystem because Vercel serverless function disks are not writable at
// runtime, so we fall back to Supabase (table: seo_health_baseline, single
// row with id=1) when fs writes fail. Reads try Supabase first when available
// and fall back to the bundled JSON for first-run bootstrap.
//
// Diff logic: a "new" issue = a (type, url) pair that exists in this run but
// did not exist in the previous run. Resolved = present last run but absent
// now. The email only fires on NEW issues. Resolved + carried-over are
// surfaced in the Monday digest.

import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Issue, IssueType } from './seo-health-crawler';

const BASELINE_PATH = path.join(process.cwd(), 'scripts', 'seo-health-baseline.json');
const SUPABASE_TABLE = 'seo_health_baseline';

export interface BaselineFile {
  lastRunIso: string;
  totalUrls: number;
  issues: Array<{ type: IssueType; url: string; detail: string }>;
  history?: Array<{ iso: string; totalIssues: number }>;
}

export interface BaselineDiff {
  newIssues: Issue[];
  resolvedIssues: Issue[];
  carriedIssues: Issue[];
  previousTotal: number;
  currentTotal: number;
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function loadBaseline(): Promise<BaselineFile | null> {
  // 1. Try Supabase (works in Vercel runtime).
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('payload')
        .eq('id', 1)
        .maybeSingle();
      if (!error && data?.payload) {
        return data.payload as BaselineFile;
      }
    } catch {
      // fall through to filesystem
    }
  }

  // 2. Fall back to the committed JSON for bootstrap reads.
  try {
    const raw = fs.readFileSync(BASELINE_PATH, 'utf-8');
    return JSON.parse(raw) as BaselineFile;
  } catch {
    return null;
  }
}

export async function saveBaseline(baseline: BaselineFile): Promise<{
  savedTo: 'supabase' | 'filesystem' | 'none';
  error?: string;
}> {
  // 1. Try Supabase upsert.
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert({ id: 1, payload: baseline, updated_at: new Date().toISOString() });
      if (!error) return { savedTo: 'supabase' };
      // Table may not exist yet; fall through.
    } catch {
      // fall through
    }
  }

  // 2. Try filesystem (works locally but NOT on Vercel runtime).
  try {
    fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2), 'utf-8');
    return { savedTo: 'filesystem' };
  } catch (err) {
    return {
      savedTo: 'none',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function diffIssues(previous: Issue[], current: Issue[]): BaselineDiff {
  const key = (i: { type: string; url: string }) => `${i.type}::${i.url}`;
  const prevSet = new Map(previous.map((i) => [key(i), i]));
  const currSet = new Map(current.map((i) => [key(i), i]));

  const newIssues: Issue[] = [];
  const carriedIssues: Issue[] = [];
  const resolvedIssues: Issue[] = [];

  for (const [k, i] of currSet) {
    if (prevSet.has(k)) carriedIssues.push(i);
    else newIssues.push(i);
  }
  for (const [k, i] of prevSet) {
    if (!currSet.has(k)) resolvedIssues.push(i);
  }

  return {
    newIssues,
    resolvedIssues,
    carriedIssues,
    previousTotal: previous.length,
    currentTotal: current.length,
  };
}

export function buildNewBaseline(
  totalUrls: number,
  issues: Issue[],
  prior: BaselineFile | null
): BaselineFile {
  const history = (prior?.history ?? []).slice(-30); // keep last 30 runs
  history.push({ iso: new Date().toISOString(), totalIssues: issues.length });
  return {
    lastRunIso: new Date().toISOString(),
    totalUrls,
    issues: issues.map((i) => ({ type: i.type, url: i.url, detail: i.detail })),
    history,
  };
}
