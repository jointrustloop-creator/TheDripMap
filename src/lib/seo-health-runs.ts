// WS6 (2026-06-11) — helper for writing one row per crawl run + N rows
// per issue per run. Used by /api/cron/seo-health (Layer A). Future
// callers from Layer B can use the same shape.
//
// All writes go through the service-role Supabase client. Errors are
// caught and returned, never thrown, so the cron's main happy path is
// never blocked by a logging failure.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Issue } from './seo-health-crawler';

const RUNS_TABLE = 'seo_health_runs';
const FINDINGS_TABLE = 'seo_health_findings';

export type RunStatus = 'started' | 'ok' | 'partial' | 'error';
export type Layer = 'A_crawl' | 'B_gsc';

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function startRun(layer: Layer, meta: Record<string, unknown> = {}): Promise<{
  id: number | null;
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) return { id: null, error: 'no supabase env' };
  try {
    const { data, error } = await supabase
      .from(RUNS_TABLE)
      .insert({ layer, status: 'started', meta })
      .select('id')
      .single();
    if (error) return { id: null, error: error.message };
    return { id: (data?.id as number) ?? null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface FinishPayload {
  status: RunStatus;
  total_urls?: number;
  crawled_urls?: number;
  issue_count?: number;
  duration_ms?: number;
  truncated?: boolean;
  error_message?: string | null;
  meta?: Record<string, unknown>;
}

export async function finishRun(runId: number, payload: FinishPayload): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'no supabase env' };
  try {
    const { error } = await supabase
      .from(RUNS_TABLE)
      .update({
        finished_at: new Date().toISOString(),
        status: payload.status,
        total_urls: payload.total_urls ?? null,
        crawled_urls: payload.crawled_urls ?? null,
        issue_count: payload.issue_count ?? null,
        duration_ms: payload.duration_ms ?? null,
        truncated: payload.truncated ?? null,
        error_message: payload.error_message ?? null,
        ...(payload.meta ? { meta: payload.meta } : {}),
      })
      .eq('id', runId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function recordFindings(
  runId: number,
  layer: Layer,
  issues: Issue[]
): Promise<{ ok: boolean; inserted: number; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, inserted: 0, error: 'no supabase env' };
  if (issues.length === 0) return { ok: true, inserted: 0 };
  const rows = issues.map((i) => ({
    run_id: runId,
    layer,
    url: i.url,
    type: i.type,
    detail: i.detail,
  }));
  // Insert in chunks to stay under PostgREST request size caps.
  const CHUNK = 500;
  let inserted = 0;
  try {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error } = await supabase.from(FINDINGS_TABLE).insert(slice);
      if (error) return { ok: false, inserted, error: error.message };
      inserted += slice.length;
    }
    return { ok: true, inserted };
  } catch (err) {
    return { ok: false, inserted, error: err instanceof Error ? err.message : String(err) };
  }
}
