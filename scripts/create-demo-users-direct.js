/**
 * Script para crear usuarios de demostración directamente
 * Ejecutar con: node scripts/create-demo-users-direct.js
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ejqcfkfqlqlchclhzeqv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcWNma2ZxbHFsY2hjbGh6ZXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5MjE1NSwiZXhwIjoyMDgwODY4MTU1fQ.HvD_fOy1mErPKHaRJLkoko9Y1NqRMSDFo1kloJU6oLI';

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
    age: 35,
    phone: '+34 123 456 789'
  },
  {
    email: 'usuario@habittrack.com',
    password: 'Usuario123!',
    role: 'user',
    fullName: 'Usuario Demo',
    age: 28,
    phone: '+34 987 654 321'
  }
];

async function createUsers() {
  console.log('🚀 Iniciando creación de usuarios de demostración...\n');

  for (const userData of users) {
    try {
      console.log(`📧 Procesando usuario: ${userData.email}...`);
      
      // Verificar si el usuario ya existe
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === userData.email);
      
      let userId;
      
      if (existingUser) {
        console.log(`   ⚠️  Usuario ${userData.email} ya existe, usando usuario existente...`);
        userId = existingUser.id;
      } else {
        // Crear usuario en auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.fullName
          }
        });

        if (authError) {
          throw authError;
        }

        if (!authData?.user) {
          throw new Error('No se creó el usuario');
        }

        userId = authData.user.id;
        console.log(`   ✅ Usuario creado: ${userId}`);
      }

      // Asignar rol
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: userData.role })
        .select();

      if (roleError && !roleError.message.includes('duplicate') && !roleError.message.includes('unique')) {
        console.error(`   ⚠️  Error asignando rol: ${roleError.message}`);
      } else {
        console.log(`   ✅ Rol ${userData.role} asignado`);
      }

      // Crear perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: userData.fullName,
          age: userData.age
        })
        .select();

      if (profileError && !profileError.message.includes('duplicate')) {
        console.error(`   ⚠️  Error creando perfil: ${profileError.message}`);
      } else {
        console.log(`   ✅ Perfil creado`);
      }

      // Poblar datos usando la función SQL
      console.log(`   📊 Poblando datos...`);
      const { error: populateError } = await supabase.rpc('populate_user_data', {
        p_user_id: userId,
        p_is_admin: userData.role === 'admin'
      });

      if (populateError) {
        console.error(`   ⚠️  Error poblando datos: ${populateError.message}`);
      } else {
        console.log(`   ✅ Datos poblados correctamente`);
      }

      console.log('');

    } catch (error) {
      console.error(`   ❌ Error procesando usuario ${userData.email}:`, error.message);
      console.log('');
    }
  }

  console.log('✨ Proceso completado!\n');
  await showSummary();
}

async function showSummary() {
  console.log('📈 Resumen de datos creados:\n');
  
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
  console.log('   Usuario: usuario@habittrack.com / Usuario123!\n');
  
  // Mostrar detalles por usuario
  const { data: usersData } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role,
      profiles!inner(full_name, age),
      habits(count),
      habit_completions(count),
      achievements(count)
    `)
    .in('user_id', 
      (await supabase.auth.admin.listUsers()).data?.users
        ?.filter(u => u.email?.includes('habittrack.com'))
        ?.map(u => u.id) || []
    );

  if (usersData && usersData.length > 0) {
    console.log('📋 Detalles por usuario:');
    for (const userRole of usersData) {
      const user = (await supabase.auth.admin.listUsers()).data?.users?.find(u => u.id === userRole.user_id);
      console.log(`\n   ${user?.email} (${userRole.role}):`);
      console.log(`     - Perfil: ${userRole.profiles?.[0]?.full_name || 'N/A'}`);
      console.log(`     - Hábitos: ${userRole.habits?.[0]?.count || 0}`);
      console.log(`     - Completados: ${userRole.habit_completions?.[0]?.count || 0}`);
      console.log(`     - Logros: ${userRole.achievements?.[0]?.count || 0}`);
    }
  }
}

// Ejecutar
createUsers().catch(console.error);

