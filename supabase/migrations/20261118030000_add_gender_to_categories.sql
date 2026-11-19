ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'universal'
  CHECK (gender IN ('men', 'women', 'universal'));
