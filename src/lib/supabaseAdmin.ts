import { createClient } from '@supabase/supabase-js'

// Lazy-loaded admin client to avoid crashing the app if keys are missing on non-admin pages
let adminClient: any = null;

export const getSupabaseAdmin = () => {
  if (adminClient) return adminClient;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('Supabase admin credentials missing. Admin features will not work.');
    return null;
  }

  adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return adminClient;
}

