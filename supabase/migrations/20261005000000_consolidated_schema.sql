-- =============================================================================
-- ZION EYE CARE — COMPLETE CONSOLIDATED DATABASE SCHEMA
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================================================
-- 1. USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id         uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name       text,
  phone      text,
  email      text,
  role       text NOT NULL DEFAULT 'user',
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    coalesce(
      (auth.jwt() ->> 'role') = 'service_role'
      OR LOWER(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('admin', 'super admin')
      OR LOWER(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) IN ('admin', 'super admin')
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
          AND LOWER(coalesce(role, '')) IN ('admin', 'super admin')
      ),
      false
    )
  );
END;
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view users"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert users"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id AND LOWER(coalesce(role, 'user')) = 'user');

CREATE POLICY "Users can update users"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = id
      AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
    )
  );


-- =============================================================================
-- 2. PRODUCT CATEGORIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  category_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL UNIQUE,
  description text,
  slug        text NOT NULL UNIQUE,
  image_url   text,
  parent_id   bigint REFERENCES public.categories(category_id) ON DELETE SET NULL,
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin());


-- =============================================================================
-- 3. PRODUCTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  product_id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                text NOT NULL,
  description         text,
  sku                 text,
  category_id         bigint REFERENCES public.categories(category_id) ON DELETE SET NULL,
  gender              text NOT NULL DEFAULT 'universal' CHECK (gender IN ('men', 'women', 'universal')),
  price               numeric(10,2) NOT NULL DEFAULT 0,
  compare_price       numeric(10,2),
  discount_price      numeric(10,2),
  stock               integer DEFAULT 0,
  image_url           text,
  images              jsonb DEFAULT '[]'::jsonb,
  slug                text UNIQUE,
  has_variants        boolean DEFAULT false,
  is_featured         boolean DEFAULT false,
  is_active           boolean DEFAULT true,
  frame_shape         text,
  frame_measurements  text,
  fit                 text,
  color               text,
  colors              jsonb DEFAULT '[]'::jsonb,
  sizes               jsonb DEFAULT '[]'::jsonb,
  tags                jsonb DEFAULT '[]'::jsonb,
  badge               text,
  lens_options        jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at          timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at          timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin());


-- =============================================================================
-- 5. PRODUCT VARIANTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  variant_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id       bigint REFERENCES public.products(product_id) ON DELETE CASCADE NOT NULL,
  size             text,
  color            text,
  color_code       text,
  sku              text UNIQUE,
  price            numeric(10,2) DEFAULT 0,
  compare_price    numeric(10,2),
  stock            integer DEFAULT 0,
  stock_alert      integer,
  images           jsonb DEFAULT '[]'::jsonb,
  is_active        boolean DEFAULT true,
  created_at       timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at       timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE (product_id, size, color)
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants (product_id);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to product variants"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage variants"
  ON public.product_variants FOR ALL
  USING (public.is_admin());


-- =============================================================================
-- 6. USER ADDRESSES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  address_id    bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  user_id       uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  full_name     text NOT NULL,
  phone         text,
  phone_number  text,
  pincode       text,
  postal_code   text,
  address_line  text,
  address_line1 text,
  address_line2 text,
  city          text NOT NULL,
  state         text NOT NULL,
  is_default    boolean DEFAULT false,
  created_at    timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses (user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addresses"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
  ON public.addresses FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage all addresses"
  ON public.addresses FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================================
-- 7. ORDERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                      text PRIMARY KEY,
  user_id                 uuid REFERENCES auth.users ON DELETE SET NULL,
  address_id              bigint,
  item_name               text,
  quantity                integer DEFAULT 1,
  items                   jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_price             numeric(10,2) DEFAULT 0,
  total_amount            numeric(10,2) DEFAULT 0,
  subtotal                numeric(10,2),
  discount_amount         numeric(10,2) DEFAULT 0,
  coupon_code             text,
  shipping_fee            numeric(10,2) DEFAULT 0,
  status                  text NOT NULL DEFAULT 'pending',
  delivery_status         text DEFAULT 'Pending',
  shipping_address        jsonb,
  payment                 text,
  payment_method          text NOT NULL DEFAULT 'COD',
  payment_status          text NOT NULL DEFAULT 'pending',
  type                    text DEFAULT 'Regular',
  razorpay_order_id       text,
  razorpay_payment_id     text,
  razorpay_signature      text,
  notes                   text,
  admin_notes             text,
  tracking_number         text,
  courier_name            text,
  waybill                 text,
  tracking_url            text,
  delivery_provider       text,
  shipment_id             text,
  shipment_error          text,
  invoice_printed         boolean DEFAULT false,
  estimated_delivery_date timestamp with time zone,
  dispatched_at           timestamp with time zone,
  delivered_at            timestamp with time zone,
  order_date              timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at              timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at              timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_order_date_idx ON public.orders (order_date DESC);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND payment_status = 'pending'
  );

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Users can update their own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'Cancelled'
    AND payment_status = (SELECT o.payment_status FROM public.orders o WHERE o.id = orders.id)
    AND total_amount = (SELECT o.total_amount FROM public.orders o WHERE o.id = orders.id)
  );


-- =============================================================================
-- 8. ORDER ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id     text REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id   bigint REFERENCES public.products(product_id) ON DELETE SET NULL,
  variant_id   bigint REFERENCES public.product_variants(variant_id) ON DELETE SET NULL,
  product_name text NOT NULL,
  price        numeric(10,2) NOT NULL,
  quantity     integer NOT NULL,
  size         text,
  color        text,
  sku          text,
  category     text,
  image_url    text,
  created_at   timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND LOWER(users.role) IN ('admin', 'super admin')
    )
  );

CREATE POLICY "Admins can update order items"
  ON public.order_items FOR UPDATE
  USING (public.is_admin());


-- =============================================================================
-- 9. CART ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  product_id bigint REFERENCES public.products(product_id) ON DELETE CASCADE NOT NULL,
  variant_id bigint REFERENCES public.product_variants(variant_id) ON DELETE SET NULL,
  size       text NOT NULL,
  color      text,
  quantity   integer NOT NULL DEFAULT 1,
  lens_selection   jsonb,
  lens_addon_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, product_id, size, color)
);

CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON public.cart_items (user_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cart items"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- 10. BANNERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.banners (
  banner_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id          bigint GENERATED ALWAYS AS (banner_id) STORED,
  image_url   text,
  mobile_url  text,
  link_url    text,
  is_active   boolean DEFAULT true,
  created_at  timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at  timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to banners"
  ON public.banners FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (public.is_admin());


-- =============================================================================
-- 11. SHIPPING RATES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  state       text NOT NULL UNIQUE,
  fee         numeric NOT NULL DEFAULT 0,
  free_above  numeric,
  is_active   boolean DEFAULT true,
  created_at  timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to shipping rates"
  ON public.shipping_rates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage shipping rates"
  ON public.shipping_rates FOR ALL
  USING (public.is_admin());


-- =============================================================================
-- 12. COUPONS MANAGEMENT TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code                text NOT NULL,
  description         text,
  discount_type       text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value      numeric(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount    numeric(10,2) DEFAULT 0,
  max_discount_amount numeric(10,2),
  category_id         bigint REFERENCES public.categories(category_id) ON DELETE SET NULL,
  usage_limit         integer,
  per_user_limit      integer DEFAULT 1,
  used_count          integer NOT NULL DEFAULT 0,
  start_date          timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expiry_date         timestamp with time zone,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at          timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_upper_idx ON public.coupons (UPPER(code));
CREATE INDEX IF NOT EXISTS coupons_category_id_idx ON public.coupons(category_id);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to coupons"
  ON public.coupons FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (public.is_admin());

-- Seed default coupons if not present
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, is_active)
SELECT 'WELCOME10', 'Welcome discount for all customers', 'percentage', 10, 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.coupons WHERE UPPER(code) = 'WELCOME10');

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, is_active)
SELECT 'FESTIVE20', 'Festive season special discount', 'percentage', 20, 499, true
WHERE NOT EXISTS (SELECT 1 FROM public.coupons WHERE UPPER(code) = 'FESTIVE20');


-- =============================================================================
-- 13b. COUPON USAGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  coupon_id   bigint REFERENCES public.coupons(id) ON DELETE CASCADE,
  coupon_code text NOT NULL,
  user_id     text,
  order_id    text,
  created_at  timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS coupon_usages_coupon_user_idx ON public.coupon_usages(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS coupon_usages_code_user_idx ON public.coupon_usages(UPPER(coupon_code), user_id);

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coupon_usages"
  ON public.coupon_usages FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Users can insert their own coupon_usages"
  ON public.coupon_usages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Admins can manage coupon_usages"
  ON public.coupon_usages FOR ALL
  USING (public.is_admin());


-- =============================================================================
-- 13c. LENSES & LENS THICKNESSES TABLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lenses (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  thicknesses jsonb DEFAULT '[]'::jsonb,
  created_at  timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at  timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to lenses"
  ON public.lenses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage lenses"
  ON public.lenses FOR ALL
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.lens_thicknesses (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lens_id         bigint NOT NULL REFERENCES public.lenses(id) ON DELETE CASCADE,
  name            text NOT NULL,
  lens_index      text NOT NULL,
  power_range     text,
  base_price      numeric(10,2) NOT NULL DEFAULT 0,
  best_suited_for text,
  sort_order      integer DEFAULT 0,
  created_at      timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS lens_thicknesses_lens_id_idx ON public.lens_thicknesses(lens_id);

ALTER TABLE public.lens_thicknesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to lens_thicknesses"
  ON public.lens_thicknesses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage lens_thicknesses"
  ON public.lens_thicknesses FOR ALL
  USING (public.is_admin());


-- =============================================================================
-- 14. FUNCTIONS & TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_user_exists(email_to_check text)
RETURNS boolean
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_to_check
  );
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, phone, email, role, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name',  'No name set'),
    COALESCE(new.raw_user_meta_data->>'phone', 'No phone set'),
    new.email,
    'user',
    new.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


CREATE OR REPLACE FUNCTION public.delete_own_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.generate_order_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today    date    := current_date;
  date_str text    := to_char(today, 'YYYYMMDD');
  prefix   text    := 'ORD' || date_str;
  next_seq integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(prefix));

  SELECT COALESCE(
    MAX(NULLIF(regexp_replace(substring(id FROM length(prefix) + 1), '[^0-9]', '', 'g'), '')::integer),
    0
  ) + 1
  INTO next_seq
  FROM public.orders
  WHERE id LIKE prefix || '%';

  RETURN prefix || lpad(next_seq::text, 4, '0');
END;
$$;


CREATE OR REPLACE FUNCTION public.set_order_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF new.id IS NULL OR new.id = '' THEN
    new.id := public.generate_order_id();
  END IF;
  RETURN new;
END;
$$;

CREATE TRIGGER trg_set_order_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_id();


-- =============================================================================
-- 15. STORAGE BUCKETS & RLS POLICIES
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product_img',    'product_img',    true),
  ('categories_img', 'categories_img', true),
  ('banners',        'banners',        true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product_img');

CREATE POLICY "Allow public read access to category images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'categories_img');

CREATE POLICY "Allow public read access to banner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Admins can manage product images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'product_img' AND public.is_admin())
  WITH CHECK (bucket_id = 'product_img' AND public.is_admin());

CREATE POLICY "Admins can manage category images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'categories_img' AND public.is_admin())
  WITH CHECK (bucket_id = 'categories_img' AND public.is_admin());

CREATE POLICY "Admins can manage banner images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'banners' AND public.is_admin())
  WITH CHECK (bucket_id = 'banners' AND public.is_admin());
