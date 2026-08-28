import { createBrowserClient } from "@supabase/ssr";
import {
  AUTH_STORAGE_KEY,
  authStorage,
  clearLegacyAuthStorage,
} from "@/lib/supabase/auth-storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

clearLegacyAuthStorage();

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: authStorage,
      storageKey: AUTH_STORAGE_KEY,
    },
  });

export const supabase = createClient();
