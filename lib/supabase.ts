import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Access environment variables. In Expo, use process.env.EXPO_PUBLIC_...
// Fallback to provided credentials if env vars are missing
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://udzhhkimdpjijdxzxnyp.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_mtFEPN-ig3m-dbF8ej_Sow_tlM6A9Y1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);