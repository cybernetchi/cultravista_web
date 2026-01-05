import { createClient, SupabaseClient } from "@supabase/supabase-js";

// For Vite, use import.meta.env instead of process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create a mock client if credentials aren't configured yet
let supabase: SupabaseClient;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Supabase credentials not configured. Some features may not work.');
  // Create a minimal mock that won't crash the app
  supabase = {
    functions: {
      invoke: async (name: string, options?: { body?: unknown }) => {
        console.error(`Cannot invoke ${name}: Supabase not configured`);
        return { data: null, error: new Error('Supabase not configured') };
      }
    }
  } as unknown as SupabaseClient;
}

export { supabase };
