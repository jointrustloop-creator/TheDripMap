require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SLUG = 'thedripmap-launches-toronto-gta-iv-therapy';
const STORAGE_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';

(async () => {
  // Double-check slug isn't taken
  const { count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('slug', SLUG);
  if (count > 0) {
    console.error('Slug already exists — aborting to avoid overwrite.');
    process.exit(1);
  }

  const content = fs.readFileSync(`scripts/blog-drafts/${SLUG}.md`, 'utf8');
  const now = new Date().toISOString();

  // related_clinics is a uuid[] column — resolve slugs to provider IDs.
  const sigSlugs = [
    'signature-beauty-lounge-downtown-toronto',
    'signature-beauty-lounge-richmond-hill',
  ];
  const { data: sigs, error: sigErr } = await supabase
    .from('providers')
    .select('id, slug')
    .in('slug', sigSlugs);
  if (sigErr) {
    console.error('Failed to resolve provider UUIDs:', sigErr);
    process.exit(1);
  }
  const relatedClinicIds = (sigs || []).map((p) => p.id);
  console.log('Resolved related_clinics UUIDs:', relatedClinicIds);

  const row = {
    slug: SLUG,
    title: 'TheDripMap Is Now Live in Toronto — Find Verified IV Therapy Clinics Across the GTA',
    content,
    excerpt:
      "TheDripMap is now fully live across Toronto and the Greater Toronto Area — verified clinic listings, Canadian pricing, and Safety Verified credentials across all six major Canadian provinces.",
    category: 'News',
    author: 'TheDripMap Editorial Team',
    image_url: `${STORAGE_BASE}iv-therapy-modern-clinic-recliners.jpg`,
    date: now,
    last_updated: now,
    meta_title:
      'TheDripMap Is Live in Toronto — Verified IV Therapy Clinics Across the GTA',
    meta_description:
      'TheDripMap is now live in Toronto and the GTA — find verified IV therapy clinics across Toronto, Mississauga, Richmond Hill, Oakville, Brampton, Vaughan, Markham and beyond, with Safety Verified credentials and CAD pricing.',
    related_clinics: relatedClinicIds,
    related_cities: ['Toronto', 'Mississauga', 'Richmond Hill', 'Oakville'],
  };

  const { data, error } = await supabase.from('blog_posts').insert(row).select().single();
  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }
  console.log('Inserted blog post:');
  console.log('  id:', data.id);
  console.log('  slug:', data.slug);
  console.log('  title:', data.title);
  console.log('  category:', data.category);
  console.log('  date:', data.date);
  console.log('  word approx:', content.split(/\s+/).length);
})();
