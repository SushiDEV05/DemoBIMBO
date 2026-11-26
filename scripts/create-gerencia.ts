import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

// Necesitamos la **Service Role Key** (clave de administrador) para crear usuarios mediante la API de Auth.
// Asegúrate de que .env.local contiene la variable SUPABASE_SERVICE_ROLE_KEY.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Configura los datos del nuevo usuario
const NEW_USER = {
  email: 'gerencia@example.com',
  password: 'StrongPass123!', // Cambia la contraseña si lo deseas
  emailConfirm: true,
};

async function main() {
  // 1️⃣ Crear el usuario en Auth (admin API)
  const { data: user, error: createErr } = await supabase.auth.admin.createUser({
    email: NEW_USER.email,
    password: NEW_USER.password,
    email_confirm: NEW_USER.emailConfirm,
  });

  if (createErr) {
    console.error('❌ Error al crear el usuario en Auth:', createErr);
    return;
  }

  console.log('✅ Usuario Auth creado:', user?.id);

  // 2️⃣ Insertar/Actualizar el perfil con rol GERENCIA
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: user!.id, rol: 'GERENCIA' });

  if (profileErr) {
    console.error('❌ Error al crear/actualizar el perfil:', profileErr);
    return;
  }

  console.log('✅ Perfil creado con rol GERENCIA');
}

main().catch((e) => console.error('❌ Excepción inesperada:', e));
