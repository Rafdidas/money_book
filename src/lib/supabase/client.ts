import { createClient } from '@supabase/supabase-js';
import {
  AUTH_STORAGE_KEY,
  authStorage,
  clearLegacyAuthStorage,
} from "@/lib/supabase/auth-storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

clearLegacyAuthStorage();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    storageKey: AUTH_STORAGE_KEY,
  },
});
