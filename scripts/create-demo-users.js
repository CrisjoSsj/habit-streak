/**
 * Script para crear usuarios de demostración y poblar sus datos
 * Ejecutar con: node scripts/create-demo-users.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('   Necesitas VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  {
    email: 'admin@habittrack.com',
    password: 'Admin123!',
    role: 'admin',
    fullName: 'Administrador Sistema',
    age: 35
  },
  {
    email: 'usuario@habittrack.com',
    password: 'Usuario123!',
    role: 'user',
    fullName: 'Usuario Demo',
    age: 28
  }
];

async function createUsers() {
  console.log('🚀 Iniciando creación de usuarios de demostración...\n');

  for (const userData of users) {
    try {
      console.log(`📧 Creando usuario: ${userData.email}...`);
      
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: {
          full_name: userData.fullName
        }
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          console.log(`   ⚠️  Usuario ${userData.email} ya existe, obteniendo datos...`);
          
          // Obtener usuario existente
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === userData.email);
          
          if (existingUser) {
            await populateUserData(existingUser.id, userData);
            continue;
          } else {
            console.error(`   ❌ No se pudo encontrar el usuario existente`);
            continue;
          }
        } else {
          throw authError;
        }
      }

      if (!authData?.user) {
        throw new Error('No se creó el usuario');
      }

      const userId = authData.user.id;
      console.log(`   ✅ Usuario creado: ${userId}`);

      // Asignar rol
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: userData.role });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.error(`   ⚠️  Error asignando rol: ${roleError.message}`);
      } else {
        console.log(`   ✅ Rol ${userData.role} asignado`);
      }

      // Poblar datos usando la función SQL
      await populateUserData(userId, userData);

    } catch (error) {
      console.error(`   ❌ Error creando usuario ${userData.email}:`, error.message);
    }
  }

  console.log('\n✨ Proceso completado!');
  await showSummary();
}

async function populateUserData(userId, userData) {
  console.log(`   📊 Poblando datos para ${userData.email}...`);
  
  const { error } = await supabase.rpc('populate_user_data', {
    p_user_id: userId,
    p_is_admin: userData.role === 'admin'
  });

  if (error) {
    console.error(`   ⚠️  Error poblando datos: ${error.message}`);
  } else {
    console.log(`   ✅ Datos poblados correctamente`);
  }
}

async function showSummary() {
  console.log('\n📈 Resumen de datos creados:');
  
  const tables = [
    'profiles',
    'habits',
    'habit_completions',
    'achievements',
    'global_reminders',
    'time_periods',
    'user_roles'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (!error) {
      console.log(`   - ${table}: ${count || 0} registros`);
    }
  }

  console.log('\n👤 Credenciales de acceso:');
  console.log('   Admin: admin@habittrack.com / Admin123!');
  console.log('   Usuario: usuario@habittrack.com / Usuario123!');
}

// Ejecutar
createUsers().catch(console.error);

