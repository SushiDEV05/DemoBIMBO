import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // admin key

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

type NewUser = {
  email: string;
  password: string;
  role: 'ENCARGADO' | 'SUPERVISOR' | 'GERENCIA';
};

const users: NewUser[] = [
  {
    email: 'encargado@example.com',
    password: 'Encargado123!',
    role: 'ENCARGADO',
  },
  {
    email: 'supervisor@example.com',
    password: 'Supervisor123!',
    role: 'SUPERVISOR',
  },
  {
    email: 'gerencia@example.com',
    password: 'StrongPass123!',
    role: 'GERENCIA',
  },
];

async function main() {
  for (const u of users) {
    // 1️⃣ Create auth user via Admin API
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (authErr) {
      console.error(`❌ Error creating ${u.email}:`, authErr);
      continue;
    }

    // authUser contains the created user object; its id is directly available
    const userId = (authUser as any)?.id;
    if (!userId) {
      console.error(`❌ No ID returned for ${u.email}`);
      continue;
    }
    console.log(`✅ Auth user created → ${u.email} (id=${userId})`);

    // 2️⃣ Upsert profile with role
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, rol: u.role });

    if (profileErr) {
      console.error(`❌ Error upserting profile for ${u.email}:`, profileErr);
    } else {
      console.log(`✅ Profile upserted with role ${u.role}`);
    }
  }
}

main().catch((e) => console.error('❌ Unexpected exception:', e));
