-- This is an irreversible cleanup requested for the product catalog.
-- Product care instructions and all subcategory records/links are removed.
ALTER TABLE public.coupons DROP COLUMN IF EXISTS subcategory_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS subcategory_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS care_instructions;
DROP TABLE IF EXISTS public.subcategories;
