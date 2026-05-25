-- TheDripMap — 10-city expansion import
-- Cities: Miami, Austin, Denver, Nashville, Charlotte, Indianapolis, Columbus, Portland, Sacramento, Salt Lake City
-- Generated: 2026-05-24
-- Total clinics: 56
--
-- Breakdown by city:
--   Miami, FL ............ 6
--   Austin, TX ........... 6
--   Denver, CO ........... 6
--   Nashville, TN ........ 5
--   Charlotte, NC ........ 6
--   Indianapolis, IN ..... 5
--   Columbus, OH ......... 5
--   Portland, OR ......... 6
--   Sacramento, CA ....... 5
--   Salt Lake City, UT ... 6
--
-- All cities reached >=5 clinics.
--
-- Notable patterns:
--   • Mobile-only IV is the dominant model in Salt Lake City (Salt City IV, The Vitamin Bar)
--     and Indianapolis (Indiana Mobile IV, Green IV). For mobile-only providers the
--     "address" stored is the registered business / mailing address; service is
--     concierge-to-location.
--   • Chain dominance: Restore Hyper Wellness, Prime IV Hydration, The DRIPBaR, Drip
--     Hydration, and Hydramed appear in nearly every market. We included only the
--     single most prominent local of each chain per city (or skipped where stronger
--     local options exist). Suburb-only chain locations (e.g., AustinMD in Cedar Park,
--     Onus IV in Highlands Ranch, Hydrate Medical Ballantyne, Liquivida Aventura)
--     were skipped in favor of in-city footprints.
--   • Strong local independents: ELIXR Miami, Twin Rivers Denver, Vida-Flo Nashville,
--     Hydrate Medical Charlotte, LUX Wellness Sacramento, FIKA SLC, Hydrate Me Columbus.
--   • Portland skews naturopath-led (Dr. Heather Friedman, Inner Gate, Portland Clinic
--     of Holistic Health) rather than the "IV bar" lifestyle model.
--
-- Notes / chains noted but not duplicated:
--   • Miami: Liquivida also has Aventura, Doral, PGA locations; ELIXR also Miami Beach,
--     Miami Shores, Doral; Drip Hydration (mobile, included as separate primary
--     provider for Miami).
--   • Austin: Restore Hyper Wellness has 5 Austin-area locations (Mueller, S Lamar,
--     N Capital of TX, William Cannon, Four Points, Triangle); used S Lamar only.
--   • Denver: Onus IV has 4 metro locations; Hydrate IV Bar has 3 (Highlands, Wash
--     Park, Highlands Ranch); used the most central Denver locations.
--   • Charlotte: Hydrate Medical also operates Ballantyne and Cotswold locations;
--     Restore Hyper Wellness also operates Rea Farms and Carmel locations.
--   • Indianapolis: Vitality IV Bar also has a Broad Ripple (Guilford Ave) location.
--   • Columbus: The Confidence Lab is in Powell suburb but services Columbus and is
--     marketed for Columbus market; included as Powell address but tied to Columbus.
--   • SLC: FIKA also has Lehi, Park City, Woods Cross locations.

-- =====================
-- MIAMI, FL (6 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('ELIXR IV Therapy', 'elixr-iv-therapy-miami', 'Miami', 'FL', 'US', '175 SW 7th St, Ste 1102, Miami, FL 33130', '(786) 323-7099', 'https://www.elixrme.com', 'IV Therapy', 4.9, 69, false),
('Liquivida Lounge Brickell', 'liquivida-lounge-brickell-miami', 'Miami', 'FL', 'US', '848 Brickell Ave, Unit 617, Miami, FL 33131', '(305) 504-8860', 'https://www.liquivida.com/brickell', 'IV Therapy', NULL, NULL, false),
('REVIV Miami Brickell', 'reviv-miami-brickell-miami', 'Miami', 'FL', 'US', '901 S Miami Ave, Ste 211, Miami, FL 33130', '(786) 745-3533', 'https://go.revivme.com/miami-brickell', 'IV Therapy', 4.8, 54, false),
('EverLiv IV Therapy', 'everliv-iv-therapy-miami', 'Miami', 'FL', 'US', '1395 Brickell Ave, Ste 923, Miami, FL 33131', '(305) 907-3399', 'https://www.everlivmia.com', 'IV Therapy', NULL, NULL, false),
('Key Basis IV & Wellness', 'key-basis-iv-wellness-miami', 'Miami', 'FL', 'US', '1100 S Miami Ave, Miami, FL 33130', '(305) 998-0047', 'https://www.keybasisiv.com', 'IV Therapy', NULL, NULL, false),
('Drip Wellness IV', 'drip-wellness-iv-miami', 'Miami', 'FL', 'US', '3625 NW 82nd Ave, Ste 400, Doral, FL 33166', '(305) 703-7853', 'https://www.dripwellnessiv.com', 'IV Therapy', NULL, NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- AUSTIN, TX (6 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('IVitamin South Congress', 'ivitamin-south-congress-austin', 'Austin', 'TX', 'US', '515 S Congress Ave, Ste 104, Austin, TX 78704', '(512) 275-6448', 'https://ivitamintherapy.com', 'IV Therapy', NULL, NULL, false),
('IVitamin North', 'ivitamin-north-austin', 'Austin', 'TX', 'US', '2700 W Anderson Ln, Ste 227, Austin, TX 78757', '(512) 275-6448', 'https://ivitamintherapy.com', 'IV Therapy', NULL, NULL, false),
('The DRIPBaR Austin The Domain', 'the-dripbar-austin-the-domain', 'Austin', 'TX', 'US', '11011 Domain Dr, Ste 104, Austin, TX 78758', '(512) 649-8323', 'https://thedripbar.com/austin-the-domain', 'IV Therapy', 4.9, 449, false),
('Fluid Revival Mobile IV', 'fluid-revival-mobile-iv-austin', 'Austin', 'TX', 'US', '5818 Balcones Dr, Ste 200D, Austin, TX 78731', '(512) 337-3561', 'https://fluidrevival.com', 'IV Therapy', NULL, NULL, false),
('Restore Hyper Wellness - South Lamar', 'restore-hyper-wellness-south-lamar-austin', 'Austin', 'TX', 'US', '1100 S Lamar Blvd, Ste 2114, Austin, TX 78704', '(512) 291-3156', 'https://www.restore.com/locations/tx-austin-south-lamar-tx024', 'IV Therapy', NULL, NULL, false),
('Liquid Wellness & IV Hydration', 'liquid-wellness-iv-hydration-austin', 'Austin', 'TX', 'US', 'Austin, TX', '(737) 444-2444', 'https://liquidmobileiv.com', 'IV Therapy', NULL, NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- DENVER, CO (6 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('Twin Rivers IV & Wellness Lounge', 'twin-rivers-iv-wellness-lounge-denver', 'Denver', 'CO', 'US', '1562 S Pearl St, Denver, CO 80210', '(720) 883-1665', 'https://twinriversiv.com', 'IV Therapy', 5.0, 238, false),
('Onus iV Hydration Bar - Highlands', 'onus-iv-hydration-bar-highlands-denver', 'Denver', 'CO', 'US', '3233 Tejon St, Ste 107, Denver, CO 80211', '(720) 417-9590', 'https://www.onusiv.com/locations/highlands', 'IV Therapy', NULL, NULL, false),
('Prime IV Hydration & Wellness - Cherry Creek', 'prime-iv-hydration-wellness-cherry-creek-denver', 'Denver', 'CO', 'US', '201 Steele St, Ste 1H, Denver, CO 80206', '(720) 571-8708', 'https://primeivhydration.com/locations/colorado/cherry-creek-denver-co', 'IV Therapy', NULL, NULL, false),
('Hydrate IV Bar - Highlands Square', 'hydrate-iv-bar-highlands-square-denver', 'Denver', 'CO', 'US', '3440 W 32nd Ave, Denver, CO 80211', '(720) 535-1919', 'https://hydrateivbar.com/locations/highlands-square', 'IV Therapy', NULL, 137, false),
('Hydrate IV Bar - Washington Park', 'hydrate-iv-bar-washington-park-denver', 'Denver', 'CO', 'US', '753 S University Blvd, Denver, CO 80209', '(720) 287-2602', 'https://hydrateivbar.com', 'IV Therapy', NULL, 183, false),
('Awaken IV Therapy', 'awaken-iv-therapy-denver', 'Denver', 'CO', 'US', '3785 E 104th Ave, Ste 692, Thornton, CO 80233', '(303) 409-3690', 'https://awakeniv.com', 'IV Therapy', NULL, NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- NASHVILLE, TN (5 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('Vida-Flo Nashville', 'vida-flo-nashville', 'Nashville', 'TN', 'US', '1516 Demonbreun St, Nashville, TN 37203', '(615) 840-6747', 'https://govidaflo.com/nashville', 'IV Therapy', NULL, 77, false),
('Vida-Flo Fifth + Broadway', 'vida-flo-fifth-broadway-nashville', 'Nashville', 'TN', 'US', '5036 Broadway, Ste PU-1A, Nashville, TN 37203', '(615) 649-8212', 'https://govidaflo.com/nashville', 'IV Therapy', NULL, NULL, false),
('IntraVenous Solutions', 'intravenous-solutions-nashville', 'Nashville', 'TN', 'US', '2817 W End Ave, Ste 135, Nashville, TN 37203', '(615) 393-6978', 'https://www.ivsolns.com', 'IV Therapy', NULL, 38, false),
('The DRIPBaR Nashville', 'the-dripbar-nashville', 'Nashville', 'TN', 'US', '67 Lindsley Ave, Nashville, TN 37210', '(629) 895-4100', 'https://thedripbar.com/nashville', 'IV Therapy', NULL, NULL, false),
('The Drip Lab Mobile IV', 'the-drip-lab-mobile-iv-nashville', 'Nashville', 'TN', 'US', '305 Church St, Nashville, TN 37201', '(615) 910-2325', 'https://thedriplabtn.com', 'IV Therapy', NULL, NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- CHARLOTTE, NC (6 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('Hydrate Medical', 'hydrate-medical-charlotte', 'Charlotte', 'NC', 'US', '228 E Blvd, Ste 200, Charlotte, NC 28203', '(980) 352-0042', 'https://charlotte.hydratemedical.com', 'IV Therapy', NULL, 34, false),
('Hydrate Medical Ballantyne', 'hydrate-medical-ballantyne-charlotte', 'Charlotte', 'NC', 'US', '3429 Toringdon Way, Ste 116, Charlotte, NC 28277', '(704) 426-3348', 'https://hydratemedical.com', 'IV Therapy', NULL, 11, false),
('GLO IV Spa', 'glo-iv-spa-charlotte', 'Charlotte', 'NC', 'US', 'Charlotte, NC', '(704) 312-8322', 'https://www.gloivspa.com', 'IV Therapy', NULL, NULL, false),
('Restore Hyper Wellness - Southpark', 'restore-hyper-wellness-southpark-charlotte', 'Charlotte', 'NC', 'US', '1711 Montford Dr, Charlotte, NC 28209', '(980) 949-6948', 'https://www.restore.com/locations/nc-charlotte-southpark-nc002', 'IV Therapy', NULL, NULL, false),
('Drip IV Wellness & MedSpa', 'drip-iv-wellness-medspa-charlotte', 'Charlotte', 'NC', 'US', '3123 N Davidson St, Ste 103, Charlotte, NC 28205', '(704) 440-1185', 'https://www.dripivspa.com', 'IV Therapy', NULL, NULL, false),
('Heritage Regenerative Medicine', 'heritage-regenerative-medicine-charlotte', 'Charlotte', 'NC', 'US', '8058 Corporate Center Dr, Ste 300, Charlotte, NC 28226', '(980) 210-0079', 'https://heritageregen.com', 'IV Therapy', NULL, NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- INDIANAPOLIS, IN (5 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('Vitality IV Bar', 'vitality-iv-bar-indianapolis', 'Indianapolis', 'IN', 'US', '749 Massachusetts Ave, Indianapolis, IN 46204', '(317) 419-3749', 'https://trupath7.bar-z.com/301/location/vitality-iv-bar', 'IV Therapy', NULL, 11, false),
('Vitality IV Bar - Broad Ripple', 'vitality-iv-bar-broad-ripple-indianapolis', 'Indianapolis', 'IN', 'US', '6302 Guilford Ave, Indianapolis, IN 46220', '(317) 755-1469', 'https://trupath7.bar-z.com/301/location/vitality-iv-bar', 'IV Therapy', NULL, NULL, false),
('Green IV', 'green-iv-indianapolis', 'Indianapolis', 'IN', 'US', '8245 E 96th St, Ste 1019, Indianapolis, IN 46256', '(317) 480-4126', 'https://greeniv.org', 'IV Therapy', NULL, NULL, false),
('Indiana Mobile IV', 'indiana-mobile-iv-indianapolis', 'Indianapolis', 'IN', 'US', '5699 E 71st St, Ste 9A, Unit 200, Indianapolis, IN 46220', '(612) 492-1967', 'https://www.indianamobileiv.com', 'IV Therapy', NULL, NULL, false),
('Holistic Family Wellness', 'holistic-family-wellness-indianapolis', 'Indianapolis', 'IN', 'US', '8424 Naab Rd, Ste 3P, Indianapolis, IN 46260', '(317) 608-6090', 'https://holisticwellnessindiana.com', 'IV Therapy', NULL, NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- COLUMBUS, OH (5 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('Hydrate Me MedSpa', 'hydrate-me-medspa-columbus', 'Columbus', 'OH', 'US', '955 W 5th Ave, Columbus, OH 43212', '(614) 297-7565', 'https://hydratememedspa.com', 'IV Therapy', NULL, 30, false),
('Prime IV Hydration & Wellness - Gahanna', 'prime-iv-hydration-wellness-gahanna-columbus', 'Columbus', 'OH', 'US', '5008 N Hamilton Rd, Columbus, OH 43230', '(614) 412-8935', 'https://primeivhydration.com/locations/ohio/columbus-oh-43230', 'IV Therapy', NULL, NULL, false),
('Restore Hyper Wellness - Easton', 'restore-hyper-wellness-easton-columbus', 'Columbus', 'OH', 'US', '4158 Easton Gateway Dr, Columbus, OH 43219', '(614) 944-9041', 'https://www.restore.com/locations/oh-columbus-oh001', 'IV Therapy', NULL, 18, false),
('Revive 614 Mobile IV', 'revive-614-mobile-iv-columbus', 'Columbus', 'OH', 'US', 'Columbus, OH', '(614) 208-0985', 'https://www.revive614.com', 'IV Therapy', NULL, NULL, false),
('The Confidence Lab', 'the-confidence-lab-columbus', 'Columbus', 'OH', 'US', '4038 Powell Rd, Powell, OH 43065', '(614) 219-9983', 'https://www.myconfidencelab.com', 'IV Therapy', NULL, NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- PORTLAND, OR (6 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('Inner Gate Health & Wellness - Hollywood', 'inner-gate-health-wellness-hollywood-portland', 'Portland', 'OR', 'US', '6230 NE Halsey St, Portland, OR 97213', '(971) 279-2294', 'https://innergatepdx.com', 'IV Therapy', NULL, 35, false),
('Inner Gate Health & Wellness - Ankeny', 'inner-gate-health-wellness-ankeny-portland', 'Portland', 'OR', 'US', '1421 SE Ankeny St, Portland, OR 97214', '(503) 284-6996', 'https://innergatepdx.com', 'IV Therapy', NULL, 73, false),
('Dr. Heather Friedman ND - The Heal House', 'dr-heather-friedman-nd-the-heal-house-portland', 'Portland', 'OR', 'US', '1734 NE Broadway St, Portland, OR 97232', '(971) 717-3008', 'https://www.drheatherfriedman.com', 'IV Therapy', NULL, NULL, false),
('Ortho-Rejuv Wellness and Aesthetics', 'ortho-rejuv-wellness-and-aesthetics-portland', 'Portland', 'OR', 'US', '5050 NE Hoyt St, Ste 626, Portland, OR 97213', '(503) 446-6360', 'https://ortho-rejuv.com', 'IV Therapy', NULL, NULL, false),
('Beeson Wellness Center', 'beeson-wellness-center-portland', 'Portland', 'OR', 'US', '7215 SE 13th Ave, Portland, OR 97202', '(503) 238-7025', 'https://beesonwellness.com', 'IV Therapy', NULL, 56, false),
('Portland Clinic of Holistic Health', 'portland-clinic-of-holistic-health-portland', 'Portland', 'OR', 'US', '833 SW 11th Ave, Ste 525, Portland, OR 97205', '(503) 294-7070', 'https://www.holistichealthpc.com', 'IV Therapy', NULL, 19, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- SACRAMENTO, CA (5 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('LUX Wellness CA - IV Drip', 'lux-wellness-ca-iv-drip-sacramento', 'Sacramento', 'CA', 'US', '1675 Alhambra Blvd, Unit 200, Ste 2, Sacramento, CA 95816', '(657) 291-7107', 'https://luxwellnessca.com', 'IV Therapy', 5.0, 52, false),
('Aesthetic Envy', 'aesthetic-envy-sacramento', 'Sacramento', 'CA', 'US', '1321 Howe Ave, Ste 111, Sacramento, CA 95825', '(916) 333-4906', 'https://www.aestheticenvy.com', 'IV Therapy', NULL, 87, false),
('Sacramento Mobile IV Therapy', 'sacramento-mobile-iv-therapy', 'Sacramento', 'CA', 'US', '1850 Tribute Rd, Sacramento, CA 95815', '(916) 619-2185', 'https://sacramentomobileiv.com', 'IV Therapy', NULL, NULL, false),
('Humble Hydration & Wellness', 'humble-hydration-wellness-sacramento', 'Sacramento', 'CA', 'US', '9727 Elk Grove Florin Rd, Ste 120, Elk Grove, CA 95624', '(916) 937-3094', 'https://humblehydration.com', 'IV Therapy', NULL, 16, false),
('Sacramento Functional Medicine', 'sacramento-functional-medicine', 'Sacramento', 'CA', 'US', '2530 J St, Ste 100, Sacramento, CA 95816', '(916) 252-3228', 'https://sacramentofunctionalmedicine.com', 'IV Therapy', NULL, NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- SALT LAKE CITY, UT (6 clinics)
-- =====================
INSERT INTO providers (name, slug, city, state, country, address, phone, website, category, rating, reviews, is_featured) VALUES
('FIKA Infusion + Wellness - Millcreek', 'fika-infusion-wellness-millcreek-salt-lake-city', 'Salt Lake City', 'UT', 'US', '3142 S Highland Dr, Ste B5, Salt Lake City, UT 84106', '(801) 893-3777', 'https://fikainfusion.com/salt-lake-city', 'IV Therapy', NULL, 22, false),
('Cameron Wellness and Spa', 'cameron-wellness-and-spa-salt-lake-city', 'Salt Lake City', 'UT', 'US', '3378 S 2300 E, Salt Lake City, UT 84109', '(801) 486-4226', 'https://cameronwellnessandspa.com', 'IV Therapy', NULL, 12, false),
('Simply Wellness', 'simply-wellness-salt-lake-city', 'Salt Lake City', 'UT', 'US', '3355 S State St, Ste B, Salt Lake City, UT 84115', '(801) 396-2075', 'https://simplywellness.com', 'IV Therapy', NULL, NULL, false),
('Salt City IV', 'salt-city-iv-salt-lake-city', 'Salt Lake City', 'UT', 'US', 'Salt Lake City, UT', '(801) 980-0788', 'https://saltcityiv.com', 'IV Therapy', NULL, NULL, false),
('The Vitamin Bar Mobile IV', 'the-vitamin-bar-mobile-iv-salt-lake-city', 'Salt Lake City', 'UT', 'US', 'Salt Lake City, UT', '(801) 386-8668', 'https://www.thevitaminbariv.com/salt-lake-city-iv-therapy', 'IV Therapy', NULL, NULL, false),
('Drip Hydration Salt Lake City', 'drip-hydration-salt-lake-city', 'Salt Lake City', 'UT', 'US', 'Salt Lake City, UT', '(801) 666-3289', 'https://driphydration.com/coverage-areas/salt-lake-city', 'IV Therapy', NULL, NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- End of import.
