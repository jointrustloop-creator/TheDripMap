-- Peptide removal Phase 2 (revised 2026-06-05): add is_hidden column + hide
-- 52 peptide-only providers.
--
-- This SUPERSEDES scripts/sql/peptide-phase-2-hide.sql. The previous version
-- listed 59 providers including 7 false positives (natura-med-spa-and-iv-bar-
-- denver had "IV Bar" in the name; 6 others list NAD+ as a specialty). Those
-- 7 had their peptide tags stripped via scripts/_peptide-remove-phase-1b.cjs
-- on 2026-06-05 and are NOT in this UPDATE.
--
-- Idempotent: column add is `if not exists`, UPDATE only flips false -> true.
-- Reversibility: set is_hidden = false to restore.

alter table public.providers
  add column if not exists is_hidden boolean not null default false;

create index if not exists providers_is_hidden_idx
  on public.providers (is_hidden);

-- Canadian peptide-primary (Health Canada priority): 10
update public.providers set is_hidden = true where slug in (
  'vitalitymd-toronto',
  'men-s-vitality-clinic-vancouver',
  'dr-bobby-s-clinic-calgary',
  'tbt-medical-edmonton',
  'toronto-plastic-surgeons-wellness-centre-toronto',
  'gameday-men-s-health-north-york-north-york',
  'revolution-medical-clinic-vancouver',
  'dr-kris-conrad-toronto',
  'sparrow-md-advanced-medical-aesthetics-vancouver',
  'enerchanges-vancouver'
);

-- US peptide-primary: 42
update public.providers set is_hidden = true where slug in (
  'citrin-wellness-beverly-hills',
  'regenerative-health-ny-little-neck',
  'alphaman-clinic-sherman-oaks',
  'tower-urology-medical-group-los-angeles',
  'renew-beauty-med-spa-and-wellness-dallas',
  'infinity-premier-health-houston',
  'integrative-wellness-fx-dallas',
  'vida-integrative-health-miami',
  'gameday-men-s-health-dallas-north-dallas',
  'executive-medicine-of-texas-southlake',
  'lume-wellness-chicago',
  'colorado-medical-solutions-denver',
  'aspire-rejuvenation-plano',
  'gleam-medical-spa-denver',
  'physio-logic-nyc-brooklyn',
  'restorative-injectables-med-spa-denver',
  'wellness-at-century-city-los-angeles',
  'hebe-aesthetics-and-vitality-atlanta',
  'peptide-balance-clinic-las-vegas-las-vegas',
  'age-well-atl-atlanta',
  'moksha-aesthetics-potomac',
  'center-for-plastic-surgery-chevy-chase',
  'renewalpeptides-las-vegas-las-vegas',
  'elevate-miami-miami',
  'elite-health-center-nyc-new-york',
  'weiss-wellness-beauty-new-york',
  'houston-regenerative-medicine-houston',
  'chicago-aesthetics-surgery-and-med-spa-chicago',
  'z-med-clinic-and-med-spa-houston',
  'the-biostation-miami-beach',
  'evexias-medical-center-denver-lone-tree',
  'prive-aesthetics-dallas',
  'houston-men-s-health-clinic-houston',
  'juventas-wellness-denver',
  'dr-sende-wellness-miami',
  'michael-aziz-md-and-associates-new-york',
  'north-dallas-dermatology-associates-dallas',
  'wholehealth-chicago-chicago',
  'elysium-aesthetics-longevity-chicago',
  'dr-jennifer-levine-new-york',
  'pure-medical-spa-chicago',
  'progressive-medical-center-atlanta'
);
