-- Optional fields the redesigned claimed-card surfaces as data arrives from owners.
-- Run once in Supabase SQL Editor.

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS services jsonb,            -- [{name, price, description, category?}]
  ADD COLUMN IF NOT EXISTS medical_team jsonb,        -- [{name, role, bio?, photo?}]
  ADD COLUMN IF NOT EXISTS special_offers jsonb,      -- [{title, description, code?, expires?}]
  ADD COLUMN IF NOT EXISTS photos text[],
  ADD COLUMN IF NOT EXISTS online_booking_url text,
  ADD COLUMN IF NOT EXISTS is_claimed boolean DEFAULT false;

-- Backfill is_claimed = true for all is_featured = true rows we have today
UPDATE providers SET is_claimed = true WHERE is_featured = true;
