/**
 * Smoke test the peptide decommission. Tests Phases 1, 3, 4, 5, 6 on the
 * live site. Phase 2 (the is_hidden hide flow) needs the operator SQL paste
 * before it can be smoke-tested.
 */
const SITE = 'https://www.thedripmap.com';
const tick = (ok) => (ok ? '✓' : '✗');

(async () => {
  require('dotenv').config({ path: '.env.local' });
  const sb = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('=== Phase 1 verification (DB) ===');
  const hybridSlugs = [
    'bay-wellness-centre-vancouver',
    'id-cosmetic-clinic-markham',
    'gameday-men-s-health-midtown-toronto-toronto',
    'vital-infusions-and-performance-las-vegas',
    'modern-wellness-clinic-las-vegas',
  ];
  const { data: hybrids } = await sb
    .from('providers')
    .select('slug, category, specialties, is_claimed')
    .in('slug', hybridSlugs);
  for (const p of hybrids || []) {
    const hasPeptideTag = (p.specialties || []).some((s) =>
      /peptide|semaglutide|tirzepatide|bpc|sermorelin|ipamorelin|tb-500|cjc/i.test(s),
    );
    const catOk = !/peptide/i.test(p.category || '');
    console.log(
      '  ' + tick(!hasPeptideTag && catOk) + ' ' + p.slug + ' (cat=' + p.category + ', has peptide spec=' + hasPeptideTag + ')',
    );
  }

  console.log();
  console.log('=== Phase 2 verification (SQL paste needed) ===');
  const { error: e1 } = await sb.from('providers').select('is_hidden').limit(1);
  console.log('  ' + tick(!e1) + ' is_hidden column exists' + (e1 ? ' (' + e1.message + ')' : ''));
  if (!e1) {
    const { count: hidCount } = await sb
      .from('providers')
      .select('id', { count: 'exact', head: true })
      .eq('is_hidden', true);
    console.log('  ' + tick(hidCount === 59) + ' hidden count = 59 (got ' + hidCount + ')');
  }

  console.log();
  console.log('=== Phase 3 verification (live HTML) ===');
  // /treatments should not list Peptide Therapy
  const trR = await fetch(SITE + '/treatments?bust=' + Date.now(), { cache: 'no-store' });
  const trHtml = await trR.text();
  console.log('  ' + tick(trR.status === 200) + ' /treatments → HTTP ' + trR.status);
  console.log('  ' + tick(!trHtml.includes('Peptide Therapy')) + ' /treatments does NOT list "Peptide Therapy"');

  // Footer (any page) — check homepage
  const homeR = await fetch(SITE + '/?bust=' + Date.now(), { cache: 'no-store' });
  const homeHtml = await homeR.text();
  console.log('  ' + tick(!homeHtml.includes('/treatments/peptide-therapy')) + ' homepage footer no peptide link');

  // /search Peptide chip removed
  const srR = await fetch(SITE + '/search?bust=' + Date.now(), { cache: 'no-store' });
  const srHtml = await srR.text();
  // Cache-likely-stale: caveat
  console.log('  ' + tick(srR.status === 200) + ' /search → HTTP ' + srR.status + ' (X-Vercel-Cache: ' + srR.headers.get('x-vercel-cache') + ', Age ' + srR.headers.get('age') + ')');
  console.log('  ' + tick(!srHtml.includes('>Peptide Therapy<')) + ' /search no Peptide chip label');

  console.log();
  console.log('=== Phase 4 verification (301 redirect) ===');
  const r4 = await fetch(SITE + '/treatments/peptide-therapy?bust=' + Date.now(), { redirect: 'manual', cache: 'no-store' });
  console.log('  ' + tick(r4.status === 308 || r4.status === 301) + ' /treatments/peptide-therapy → HTTP ' + r4.status + ' Location: ' + (r4.headers.get('location') || '-'));

  console.log();
  console.log('=== Phase 5 verification (archived blog post) ===');
  const r5 = await fetch(SITE + '/blog/peptide-therapy-guide-2026?bust=' + Date.now(), { cache: 'no-store' });
  const r5Html = await r5.text();
  console.log('  ' + tick(r5.status === 200) + ' blog post still renders → HTTP ' + r5.status);
  console.log('  ' + tick(r5Html.includes('Archived guide')) + ' "Archived guide" banner present');
  // Check robots meta
  const robotsMatch = r5Html.match(/<meta name="robots" content="([^"]*)"/i);
  const robotsContent = robotsMatch ? robotsMatch[1] : '';
  console.log('  ' + tick(/noindex/i.test(robotsContent)) + ' meta robots noindex present (got: "' + robotsContent + '")');

  console.log();
  console.log('=== Phase 6 verification (sitemap) ===');
  const smR = await fetch(SITE + '/sitemap.xml?bust=' + Date.now(), { cache: 'no-store' });
  const smXml = await smR.text();
  console.log('  ' + tick(smR.status === 200) + ' sitemap.xml → HTTP ' + smR.status);
  console.log('  ' + tick(!smXml.includes('peptide-therapy')) + ' sitemap.xml contains no peptide-therapy URLs');

  console.log();
  console.log('=== Smoke test complete ===');
})();
