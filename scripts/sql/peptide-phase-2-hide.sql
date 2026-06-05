-- Peptide removal Phase 2: add is_hidden column + hide 59 peptide-primary providers
--
-- Idempotent: column add is `if not exists`, UPDATEs only flip false -> true so
-- re-running over already-hidden rows is a no-op.
--
-- Reversibility: every hide is `is_hidden = true`. To restore, set false.

alter table public.providers
  add column if not exists is_hidden boolean not null default false;

create index if not exists providers_is_hidden_idx
  on public.providers (is_hidden);

-- Canadian peptide-primary (Health Canada priority)
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

-- US peptide-primary
update public.providers set is_hidden = true where slug in (
  'citrin-wellness-beverly-hills',
  'regenerative-health-ny-little-neck',
  'alphaman-clinic-sherman-oaks',
  'tower-urology-medical-group-los-angeles',
  'renew-beauty-med-spa-and-wellness-dallas',
  'infinity-premier-health-houston',
  'integrative-wellness-fx-dallas',
  'vida-integrative-health-miami',
  'evolv-wellness-medspa-denver',
  'gameday-men-s-health-dallas-north-dallas',
  'executive-medicine-of-texas-southlake',
  'lume-wellness-chicago',
  'colorado-medical-solutions-denver',
  'aspire-rejuvenation-plano',
  'gleam-medical-spa-denver',
  'thrive-health-solutions-englewood',
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
  'htx-urology-webster',
  'tribecamed-miami-beach',
  'chicago-aesthetics-surgery-and-med-spa-chicago',
  'z-med-clinic-and-med-spa-houston',
  'the-biostation-miami-beach',
  'evexias-medical-center-denver-lone-tree',
  'omni-sculpt-md-dallas',
  'prive-aesthetics-dallas',
  'houston-men-s-health-clinic-houston',
  'daniel-benhuri-md-beverly-hills',
  'juventas-wellness-denver',
  'dr-sende-wellness-miami',
  'michael-aziz-md-and-associates-new-york',
  'north-dallas-dermatology-associates-dallas',
  'wholehealth-chicago-chicago',
  'natura-med-spa-and-iv-bar-denver',
  'dr-jennifer-levine-new-york',
  'pure-medical-spa-chicago',
  'elysium-aesthetics-longevity-chicago',
  'progressive-medical-center-atlanta'
);
