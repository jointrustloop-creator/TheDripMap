-- providers.online_booking_url — per-clinic deep link to the clinic's online
-- booking system (JaneApp, Vagaro, Square, Acuity, GlossGenius, Mindbody, etc.).
--
-- Used by the Drip Assistant's book_appointment tool to render a "BOOK NOW"
-- button on a claimed clinic's mini-card in chat. When null, the UI falls back
-- to a "Call to book" tel: link using providers.phone.
--
-- This column was added in the original add-claimed-card-fields.sql migration.
-- This file is kept as a no-op IF NOT EXISTS guard so a fresh environment
-- still gets the column even if the earlier migration was skipped.
--
-- Run once in Supabase SQL Editor (safe to re-run).

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS online_booking_url text;

-- Helpful index for any future queries that filter for "has booking url".
CREATE INDEX IF NOT EXISTS providers_has_booking_url_idx
  ON providers (slug) WHERE online_booking_url IS NOT NULL;
