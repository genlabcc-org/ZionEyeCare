ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS lens_selection jsonb,
  ADD COLUMN IF NOT EXISTS lens_addon_price numeric NOT NULL DEFAULT 0;
