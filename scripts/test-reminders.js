/**
 * Script para probar la función de recordatorios
 * Este script invoca la Edge Function y muestra los resultados
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

async function testReminders() {
  console.log('🧪 Probando función de recordatorios...\n');

  try {
    // Verificar hábitos con recordatorios activos
    console.log('📋 Verificando hábitos con recordatorios activos...');
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, name, user_id, reminder_enabled, reminder_time, repeat_type')
      .eq('reminder_enabled', true)
      .eq('is_archived', false)
      .not('reminder_time', 'is', null);

    if (habitsError) {
      console.error('❌ Error al obtener hábitos:', habitsError);
      return;
    }

    if (!habits || habits.length === 0) {
      console.log('⚠️  No hay hábitos con recordatorios activos');
      return;
    }

    console.log(`✅ Encontrados ${habits.length} hábito(s) con recordatorios activos:`);
    habits.forEach((habit, index) => {
      console.log(`   ${index + 1}. ${habit.name} - Recordatorio: ${habit.reminder_time}`);
    });

    // Obtener la hora actual
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    console.log(`\n⏰ Hora actual: ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);

    // Verificar si hay hábitos que deberían recibir recordatorio ahora
    const habitsToRemind = habits.filter(habit => {
      const [reminderHour, reminderMinute] = habit.reminder_time.split(':').map(Number);
      return Math.abs(currentHour - reminderHour) === 0 && Math.abs(currentMinute - reminderMinute) <= 1;
    });

    if (habitsToRemind.length === 0) {
      console.log('\n⚠️  No hay hábitos que deban recibir recordatorio en este momento');
      console.log('   La función solo envía recordatorios cuando la hora coincide (±1 minuto)');
      console.log('\n💡 Para probar el envío, puedes:');
      console.log('   1. Esperar a que sea la hora del recordatorio');
      console.log('   2. Modificar temporalmente la hora del recordatorio en la base de datos');
      console.log('   3. Modificar la función para ignorar la verificación de hora (solo para pruebas)');
    } else {
      console.log(`\n✅ ${habitsToRemind.length} hábito(s) deberían recibir recordatorio ahora`);
    }

    // Invocar la función
    console.log('\n🚀 Invocando Edge Function...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-habit-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const result = await response.json();
    
    console.log('\n📊 Resultado:');
    console.log(JSON.stringify(result, null, 2));

    if (result.sent > 0) {
      console.log(`\n✅ Se enviaron ${result.sent} correo(s) exitosamente`);
    } else {
      console.log('\n⚠️  No se enviaron correos');
      if (result.message) {
        console.log(`   Razón: ${result.message}`);
      }
    }

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error al probar recordatorios:', error);
  }
}

testReminders().catch(console.error);
