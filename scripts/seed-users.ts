/**
 * ==============================================================================
 * SISTEMA CONTROL CRÍTICO DE PLANTA (BIMBO)
 * Script de Inicialización de Usuarios Demo mediante Supabase Admin API
 * Ejecución: npx tsx scripts/seed-users.ts
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno locales
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ ERROR: Se requieren NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  console.error('Configura tu archivo .env.local con las credenciales de tu proyecto Supabase.\n');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEMO_USERS = [
  {
    email: 'encargado@bimbo.com',
    password: 'Bimbo2026!',
    nombre: 'Carlos Pérez (Encargado Pan)',
    rol: 'ENCARGADO',
    linea_id: '11111111-1111-1111-1111-111111111111', // PAN
    supervisa_todas: false,
    turno_habitual: 'MANANA',
    // Asignado a Batidora Pan y Empaquetado Pan
    etapas: [
      'a1000000-0000-0000-0000-000000000001', // Batidora
      'a1000000-0000-0000-0000-000000000008', // Empaquetado y Calidad
    ],
  },
  {
    email: 'supervisor@bimbo.com',
    password: 'Bimbo2026!',
    nombre: 'Ing. Laura Gómez (Supervisora de Planta)',
    rol: 'SUPERVISOR',
    linea_id: null,
    supervisa_todas: true,
    turno_habitual: 'MANANA',
    etapas: [],
  },
  {
    email: 'gerencia@bimbo.com',
    password: 'Bimbo2026!',
    nombre: 'Lic. Roberto Morales (Gerencia de Operaciones)',
    rol: 'GERENCIA',
    linea_id: null,
    supervisa_todas: true,
    turno_habitual: 'MANANA',
    etapas: [],
  },
];

async function seedUsers() {
  console.log('\n🍞 Inicializando usuarios de demostración en Supabase Auth...');

  let supervisorUserId: string | null = null;

  for (const u of DEMO_USERS) {
    console.log(`\n➡️ Procesando usuario: ${u.email} [${u.rol}]`);

    // 1. Buscar si el usuario ya existe en auth.users
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error(`Error al listar usuarios: ${listError.message}`);
      continue;
    }

    const existingUser = userList.users.find((x) => x.email === u.email);
    let userId: string;

    if (existingUser) {
      console.log(`   ℹ️ El usuario ya existe en Auth (ID: ${existingUser.id}). Actualizando contraseña...`);
      userId = existingUser.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: u.password,
        email_confirm: true,
        user_metadata: { nombre_completo: u.nombre, rol: u.rol },
      });
    } else {
      console.log(`   ✨ Creando nuevo usuario en Auth...`);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { nombre_completo: u.nombre, rol: u.rol },
      });

      if (createError) {
        console.error(`   ❌ Error al crear usuario en Auth: ${createError.message}`);
        continue;
      }
      userId = newUser.user.id;
      console.log(`   ✅ Creado con ID: ${userId}`);
    }

    if (u.rol === 'SUPERVISOR') {
      supervisorUserId = userId;
    }

    // 2. Insertar o actualizar perfil en la tabla profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      nombre_completo: u.nombre,
      rol: u.rol,
      linea_id: u.linea_id,
      supervisa_todas: u.supervisa_todas,
      turno_habitual: u.turno_habitual,
      activo: true,
    });

    if (profileError) {
      console.error(`   ❌ Error en profiles: ${profileError.message}`);
    } else {
      console.log(`   ✅ Perfil sincronizado correctamente.`);
    }

    // 3. Asignar etapas para encargado
    if (u.etapas.length > 0) {
      for (const etapaId of u.etapas) {
        await supabaseAdmin.from('encargado_etapas').upsert(
          {
            usuario_id: userId,
            etapa_id: etapaId,
          },
          { onConflict: 'usuario_id,etapa_id' }
        );
      }
      console.log(`   ✅ ${u.etapas.length} etapas asignadas en encargado_etapas.`);
    }
  }

  // 4. Crear órdenes iniciales activas (1 por línea) si no existen
  if (supervisorUserId) {
    console.log('\n📋 Verificando órdenes de producción activas de ejemplo...');
    const ordenesIniciales = [
      {
        codigo_orden: 'OP-PAN-2026-001',
        linea_id: '11111111-1111-1111-1111-111111111111',
        producto_id: 'c1000000-0000-0000-0000-000000000001', // Pan Blanco
        receta_id: 'd1000000-0000-0000-0000-000000000001',
        turno: 'MANANA',
        total_planificado_recetas: 20,
        producido_recetas: 0,
        estado: 'EN_PROCESO',
        created_by: supervisorUserId,
      },
      {
        codigo_orden: 'OP-BOL-2026-001',
        linea_id: '22222222-2222-2222-2222-222222222222',
        producto_id: 'c2000000-0000-0000-0000-000000000001', // Medias Noches
        receta_id: 'd2000000-0000-0000-0000-000000000001',
        turno: 'MANANA',
        total_planificado_recetas: 15,
        producido_recetas: 0,
        estado: 'EN_PROCESO',
        created_by: supervisorUserId,
      },
      {
        codigo_orden: 'OP-PQ-2026-001',
        linea_id: '33333333-3333-3333-3333-333333333333',
        producto_id: 'c3000000-0000-0000-0000-000000000001', // Panqué Nuez
        receta_id: 'd3000000-0000-0000-0000-000000000001',
        turno: 'MANANA',
        total_planificado_recetas: 10,
        producido_recetas: 0,
        estado: 'EN_PROCESO',
        created_by: supervisorUserId,
      },
    ];

    for (const op of ordenesIniciales) {
      const { error: opError } = await supabaseAdmin.from('ordenes_produccion').upsert(op, {
        onConflict: 'codigo_orden',
      });
      if (opError) {
        console.warn(`   ⚠️ Orden ${op.codigo_orden}: ${opError.message}`);
      } else {
        console.log(`   ✅ Orden ${op.codigo_orden} lista para producción.`);
      }
    }
  }

  console.log('\n🎉 Inicialización completada exitosamente.');
  console.log('\nCredenciales para pruebas:');
  console.log('--------------------------------------------------');
  console.log('1. ENCARGADO:  encargado@bimbo.com  / Bimbo2026!');
  console.log('2. SUPERVISOR: supervisor@bimbo.com / Bimbo2026!');
  console.log('3. GERENCIA:   gerencia@bimbo.com   / Bimbo2026!');
  console.log('--------------------------------------------------\n');
}

seedUsers().catch((err) => {
  console.error('\n❌ Error crítico en seedUsers:', err);
  process.exit(1);
});
