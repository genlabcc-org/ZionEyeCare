-- Optional lens tiers supported by an individual frame. Each entry stores the
-- frame-specific add-on amount so it remains stable even if the lens catalog changes.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS lens_options jsonb NOT NULL DEFAULT '[]'::jsonb;
