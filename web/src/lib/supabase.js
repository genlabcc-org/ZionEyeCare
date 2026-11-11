import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://fakeproject123.supabase.co";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "fake_random_key_123456789";

export const supabase = createClient(supabaseUrl, supabaseKey);


