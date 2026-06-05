import { getTemplate, TARGET_TYPES, BACKLINK_TEMPLATES, BacklinkTargetType } from '../src/lib/backlink-templates';

const NYC_TYPES: BacklinkTargetType[] = [
  'nyc_wellness_blog',
  'nyc_fitness_studio',
  'nyc_hospitality_concierge',
  'nyc_local_press',
  'nyc_corporate_wellness',
];

let pass = 0;
let total = 0;
function check(ok: boolean, label: string) {
  total++;
  if (ok) pass++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}`);
}

for (const t of NYC_TYPES) {
  const tpl = getTemplate(t);
  check(!!tpl, `${t} has a registered template`);
  if (!tpl) continue;
  check(tpl.subject.length > 10 && tpl.subject.length < 100, `${t} subject sized for inbox preview`);
  check(tpl.body.includes('TheDripMap'), `${t} body signs TheDripMap`);
  check(tpl.body.includes('best-iv-therapy-new-york-2026') || tpl.body.includes('cities/new-york'), `${t} body links the NYC asset`);
  check(!/—|–/.test(tpl.body) && !/—|–/.test(tpl.subject), `${t} no em/en-dashes`);
  check(tpl.preferredArticles.length > 0, `${t} has at least one preferred article`);
  check(TARGET_TYPES.includes(t), `${t} listed in TARGET_TYPES`);
  check((BACKLINK_TEMPLATES as Record<string, unknown>)[t] !== undefined, `${t} present in BACKLINK_TEMPLATES`);
}

console.log();
console.log(`  ${pass}/${total} checks passed`);
if (pass !== total) process.exit(1);
