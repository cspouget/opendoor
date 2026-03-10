import { createClient } from '@supabase/supabase-js';

/**
 * Initializes a Supabase client using environment variables. To configure
 * this for your environment, copy `.env.example` to `.env` and set
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY accordingly. The Vite
 * build process will expose variables prefixed with VITE_ to your
 * frontend code.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
