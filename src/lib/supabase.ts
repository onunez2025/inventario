import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://evnyafuyhipkbdjknyax.supabase.co'
export const supabaseAnonKey = 'sb_publishable_i5Gdg-e2Xy4TzRI7Pf4nxA_Xz5A6Xqh'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
