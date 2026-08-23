/**
 * Mirror captured clinic og:image photos into our own Supabase storage.
 *
 * WHY (2026-08-23): _fetch-og-images.cjs --load wrote each clinic's own
 * og:image URL straight into providers.image_url. Those URLs are valid and
 * return 200 at the source, but they point at 173 different clinic domains and
 * next/image only serves hosts listed in next.config.mjs images.remotePatterns.
 * Every one of them returned 400 and nothing rendered. Verified against
 * /_next/image before writing this.
 *
 * Whitelisting 173 hostnames was the wrong fix: it is config sprawl, it lets an
 * arbitrary third party host serve bytes under our domain, it hotlinks other
 * people's bandwidth, and every photo breaks the day a clinic redesigns. So the
 * bytes come to us instead. listing-photos is public and already whitelisted,
 * which is how clinic logos are handled.
 *
 * WINDOWS + NODE HARD LESSON (documented in CLAUDE.md): concurrent HTTPS
 * workers die silently on this machine, exit code 0, partway through. So this
 * is strictly sequential, with an AbortController timeout and a polite delay,
 * and it writes its state file after EVERY row so a death is resumable.
 *
 * Run: node scripts/_mirror-og-images.cjs [--limit N] [--apply]
 *      (dry run by default; --apply downloads, uploads, and repoints image_url)
 */
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'listing-photos';
const PREFIX = 'og-mirror';
const STATE = path.join('.audit-tmp', '_og-mirror-state.json');
const APPLY = process.argv.includes('--apply');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const DELAY_MS = 600;
const TIMEOUT_MS = 20000;
const MAX_BYTES = 6 * 1024 * 1024;

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
};

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { done: {}, failed: {} }; }
}
function saveState(st) {
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  fs.writeFileSync(STATE, JSON.stringify(st, null, 2), 'utf8');
}

async function fetchImage(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        // Identify honestly. Some hosts 403 an unknown agent, and we would
        // rather be refused by name than pretend to be a browser.
        'User-Agent': 'TheDripMapBot/1.0 (+https://www.thedripmap.com; listing photo mirror)',
        Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8',
      },
    });
    if (!res.ok) return { err: `HTTP ${res.status}` };
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const ext = EXT_BY_TYPE[type];
    if (!ext) return { err: `unsupported content-type ${type || '(none)'}` };
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return { err: 'empty body' };
    if (buf.length > MAX_BYTES) return { err: `too large (${(buf.length / 1048576).toFixed(1)}MB)` };
    // A 1x1 tracking pixel or a tiny spacer is not a clinic photo.
    if (buf.length < 5000) return { err: `too small (${buf.length}B), likely a spacer` };
    return { buf, type, ext };
  } catch (e) {
    return { err: e.name === 'AbortError' ? `timeout after ${TIMEOUT_MS}ms` : e.message };
  } finally { clearTimeout(t); }
}

(async () => {
  let all = [], f = 0;
  for (;;) {
    const { data, error } = await s
      .from('providers')
      .select('id,slug,image_url,decision_drivers')
      .range(f, f + 999);
    if (error) { console.error('READ FAIL', error.message); process.exit(1); }
    if (!data || !data.length) break;
    all = all.concat(data);
    if (data.length < 1000) break;
    f += 1000;
  }

  const supaHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  const targets = all.filter((p) => {
    const src = (p.decision_drivers || {}).image_source;
    if (!src || !p.image_url) return false;
    try { return new URL(p.image_url).hostname !== supaHost; } catch { return false; }
  });

  const st = loadState();
  const pending = targets.filter((p) => !st.done[p.slug]).slice(0, LIMIT);

  console.log(`captured photos on foreign hosts : ${targets.length}`);
  console.log(`already mirrored                 : ${targets.length - targets.filter((p) => !st.done[p.slug]).length}`);
  console.log(`to process this run              : ${pending.length}`);
  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to download, upload and repoint.');
    return;
  }

  let ok = 0, bad = 0, i = 0;
  for (const p of pending) {
    i++;
    const got = await fetchImage(p.image_url);
    if (got.err) {
      bad++;
      st.failed[p.slug] = { url: p.image_url, err: got.err, at: new Date().toISOString() };
      saveState(st);
      console.log(`  [${i}/${pending.length}] SKIP ${p.slug}: ${got.err}`);
      await sleep(DELAY_MS);
      continue;
    }

    const key = `${PREFIX}/${p.slug}.${got.ext}`;
    const up = await s.storage.from(BUCKET).upload(key, got.buf, { contentType: got.type, upsert: true });
    if (up.error) {
      bad++;
      st.failed[p.slug] = { url: p.image_url, err: 'upload: ' + up.error.message, at: new Date().toISOString() };
      saveState(st);
      console.log(`  [${i}/${pending.length}] UPLOAD FAIL ${p.slug}: ${up.error.message}`);
      await sleep(DELAY_MS);
      continue;
    }

    const publicUrl = s.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
    const dd = p.decision_drivers && typeof p.decision_drivers === 'object' ? p.decision_drivers : {};
    const nextDD = {
      ...dd,
      // Keep the original source URL. It is the provenance of the photo and the
      // only way to re-fetch or to answer "where did this come from".
      image_source: { ...(typeof dd.image_source === 'object' ? dd.image_source : { from: dd.image_source }), mirrored_at: new Date().toISOString(), original_url: p.image_url },
    };
    const { error: ue, count } = await s
      .from('providers')
      .update({ image_url: publicUrl, decision_drivers: nextDD }, { count: 'exact' })
      .eq('id', p.id);
    if (ue || count !== 1) {
      bad++;
      st.failed[p.slug] = { url: p.image_url, err: 'db: ' + (ue ? ue.message : `rows=${count}`), at: new Date().toISOString() };
      saveState(st);
      console.log(`  [${i}/${pending.length}] DB FAIL ${p.slug}`);
      await sleep(DELAY_MS);
      continue;
    }

    ok++;
    delete st.failed[p.slug];
    st.done[p.slug] = { key, bytes: got.buf.length, at: new Date().toISOString() };
    saveState(st); // after EVERY row, so a silent death is resumable
    if (i % 25 === 0 || i === pending.length) console.log(`  [${i}/${pending.length}] mirrored ${ok}, skipped ${bad}`);
    await sleep(DELAY_MS);
  }

  console.log(`\ndone: ${ok} mirrored, ${bad} skipped. State: ${STATE}`);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
