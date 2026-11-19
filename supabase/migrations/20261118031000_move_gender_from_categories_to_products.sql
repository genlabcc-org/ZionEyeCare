ALTER TABLE public.categories
  DROP COLUMN IF EXISTS gender;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'universal'
  CHECK (gender IN ('men', 'women', 'universal'));
