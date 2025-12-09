/**
 * Script para confirmar manualmente el email de un usuario
 * Útil para desarrollo local cuando no puedes recibir correos de confirmación
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ejqcfkfqlqlchclhzeqv.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcWNma2ZxbHFsY2hjbGh6ZXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5MjE1NSwiZXhwIjoyMDgwODY4MTU1fQ.HvD_fOy1mErPKHaRJLkoko9Y1NqRMSDFo1kloJU6oLI";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Obtener email desde argumentos de línea de comandos o usar el del ejemplo
const userEmail = process.argv[2] || 'crisjcq2004@gmail.com';

async function confirmUserEmail() {
  console.log(`🔐 Confirmando email para: ${userEmail}\n`);

  try {
    // Obtener lista de usuarios
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error al obtener usuarios:', listError);
      return;
    }

    // Buscar el usuario por email
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error(`❌ No se encontró un usuario con el email: ${userEmail}`);
      console.log('\n📋 Usuarios disponibles:');
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.email_confirmed_at ? '✅ Confirmado' : '❌ No confirmado'})`);
      });
      return;
    }

    // Verificar si ya está confirmado
    if (user.email_confirmed_at) {
      console.log(`✅ El email ${userEmail} ya está confirmado desde: ${user.email_confirmed_at}`);
      return;
    }

    // Confirmar el email manualmente
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true
      }
    );

    if (updateError) {
      console.error('❌ Error al confirmar email:', updateError);
      return;
    }

    console.log(`✅ Email confirmado exitosamente para: ${userEmail}`);
    console.log(`   Usuario ID: ${updatedUser.user.id}`);
    console.log(`   Email confirmado en: ${updatedUser.user.email_confirmed_at}`);
    console.log('\n🎉 Ahora puedes iniciar sesión con este usuario.');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

confirmUserEmail().catch(console.error);

