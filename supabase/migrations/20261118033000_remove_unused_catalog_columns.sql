ALTER TABLE public.products
  DROP COLUMN IF EXISTS compare_at_price,
  DROP COLUMN IF EXISTS stock_quantity,
  DROP COLUMN IF EXISTS available_sizes,
  DROP COLUMN IF EXISTS is_new_arrival,
  DROP COLUMN IF EXISTS is_best_seller,
  DROP COLUMN IF EXISTS is_trending,
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS review_count;

ALTER TABLE public.product_variants
  DROP COLUMN IF EXISTS stock_quantity,
  DROP COLUMN IF EXISTS price_override;
