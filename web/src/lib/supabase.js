import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://fgvgjwtkupahlcglrten.supabase.co";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_ihW2MM209VHV75qscoTSUg_XimNRaDQ";

export const supabase = createClient(supabaseUrl, supabaseKey);
