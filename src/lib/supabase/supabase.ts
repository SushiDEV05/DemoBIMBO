// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Validate that the required environment variables are present.
// Next.js loads variables that start with NEXT_PUBLIC_ at build‑time and runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env var NEXT_PUBLIC_SUPABASE_URL – add it to .env.local or Vercel env settings');
}
if (!supabaseAnonKey) {
  throw new Error('Missing env var NEXT_PUBLIC_SUPABASE_ANON_KEY – add it to .env.local or Vercel env settings');
}

// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Read env vars – prefer NEXT_PUBLIC_ (exposed to client) but also support
// non‑public versions for server‑side code (e.g., during SSR or middleware).
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Supabase URL not found. Define NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) in .env.local',
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    'Supabase anon key not found. Define NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) in .env.local',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

