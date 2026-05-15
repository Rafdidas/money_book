import { createBrowserClient } from "@supabase/ssr";
import { clearLegacyAuthStorage } from "@/lib/supabase/auth-storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

clearLegacyAuthStorage();

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);

export const supabase = createClient();
