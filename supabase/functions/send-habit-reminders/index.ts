import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface Habit {
  id: string;
  name: string;
  user_id: string;
  reminder_time: string;
  repeat_type: string;
  repeat_days: string[] | null;
  time_of_day: string;
  is_archived: boolean;
}

interface User {
  id: string;
  email: string;
}

Deno.serve(async (req: Request) => {
  try {
    // Crear cliente de Supabase con service role key
    // Las Edge Functions de Supabase tienen acceso automático a estas variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
        envKeys: Object.keys(Deno.env.toObject()),
      });
      throw new Error("Missing Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener la hora actual
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, etc.
    
    // Mapeo de días de la semana
    const dayMap: Record<number, string> = {
      0: "sun",
      1: "mon",
      2: "tue",
      3: "wed",
      4: "thu",
      5: "fri",
      6: "sat",
    };
    const currentDayCode = dayMap[currentDayOfWeek];

    // Buscar hábitos con recordatorios activos
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id, name, user_id, reminder_time, repeat_type, repeat_days, time_of_day, is_archived")
      .eq("reminder_enabled", true)
      .eq("is_archived", false)
      .not("reminder_time", "is", null);

    if (habitsError) {
      console.error("Error fetching habits:", habitsError);
      return new Response(JSON.stringify({ error: habitsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!habits || habits.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send", sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Filtrar hábitos que deben recibir recordatorio ahora
    const habitsToRemind: Habit[] = [];
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    for (const habit of habits) {
      // Parsear la hora del recordatorio
      const [reminderHour, reminderMinute] = habit.reminder_time.split(":").map(Number);
      
      // Verificar si es la hora correcta (con un margen de ±1 minuto)
      if (
        Math.abs(currentHour - reminderHour) === 0 &&
        Math.abs(currentMinute - reminderMinute) <= 1
      ) {
        // Verificar si el hábito debe aparecer hoy según su configuración
        let shouldShowToday = false;

        if (habit.repeat_type === "daily") {
          shouldShowToday = true;
        } else if (habit.repeat_type === "specific_days") {
          if (habit.repeat_days && habit.repeat_days.includes(currentDayCode)) {
            shouldShowToday = true;
          }
        } else {
          // Para x_per_week, x_per_month, x_per_year, siempre mostrar el recordatorio
          // El usuario decidirá si completarlo o no
          shouldShowToday = true;
        }

        if (shouldShowToday) {
          // Verificar si el hábito ya fue completado hoy
          const { data: completion } = await supabase
            .from("habit_completions")
            .select("id")
            .eq("habit_id", habit.id)
            .eq("completion_date", todayStr)
            .eq("is_completed", true)
            .maybeSingle();

          // Solo enviar recordatorio si NO está completado
          if (!completion) {
            habitsToRemind.push(habit);
          }
        }
      }
    }

    if (habitsToRemind.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send at this time", sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Agrupar hábitos por usuario
    const habitsByUser = new Map<string, Habit[]>();
    for (const habit of habitsToRemind) {
      if (!habitsByUser.has(habit.user_id)) {
        habitsByUser.set(habit.user_id, []);
      }
      habitsByUser.get(habit.user_id)!.push(habit);
    }

    // Obtener información de usuarios y enviar correos
    let emailsSent = 0;
    const errors: string[] = [];

    for (const [userId, userHabits] of habitsByUser) {
      try {
        // Obtener email del usuario
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError || !userData?.user?.email) {
          errors.push(`User ${userId}: ${userError?.message || "Email not found"}`);
          continue;
        }

        const userEmail = userData.user.email;
        
        // Obtener nombre del usuario desde profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle();

        const userName = profile?.full_name || userEmail.split("@")[0];

        // Preparar lista de hábitos para el correo
        const habitsList = userHabits.map(h => `• ${h.name}`).join("\n");
        
        // Preparar HTML del correo
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .habits-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .habit-item { padding: 10px; border-left: 4px solid #FF6B35; margin: 10px 0; background: #fff; }
              .button { display: inline-block; padding: 12px 24px; background: #FF6B35; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 Recordatorio de Hábitos</h1>
              </div>
              <div class="content">
                <p>Hola ${userName},</p>
                <p>Es hora de completar tus hábitos. Tienes <strong>${userHabits.length}</strong> ${userHabits.length === 1 ? "hábito pendiente" : "hábitos pendientes"}:</p>
                <div class="habits-list">
                  ${userHabits.map(h => `<div class="habit-item">${h.name}</div>`).join("")}
                </div>
                <a href="https://habittrack.com/app" class="button">Ir a HabitTrack</a>
                <div class="footer">
                  <p>Este es un recordatorio automático de HabitTrack.</p>
                  <p>Puedes desactivar los recordatorios en la configuración de cada hábito.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        
        const emailText = `
Hola ${userName},

Es hora de completar tus hábitos. Tienes ${userHabits.length} ${userHabits.length === 1 ? "hábito pendiente" : "hábitos pendientes"}:

${habitsList}

Visita https://habittrack.com/app para completarlos.

Este es un recordatorio automático de HabitTrack.
Puedes desactivar los recordatorios en la configuración de cada hábito.
        `;

        // Enviar correo usando el SMTP configurado en Supabase
        // Las credenciales SMTP deben estar en las mismas configuraciones que usas en Auth Settings
        // Configúralas como variables de entorno en Edge Functions > Secrets
        
        try {
          // Obtener configuración SMTP desde variables de entorno
          // Estas deben ser las mismas que configuraste en Project Settings > Auth > SMTP Settings
          const smtpHost = Deno.env.get("SMTP_HOST") || "";
          const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
          const smtpUser = Deno.env.get("SMTP_USER") || "";
          const smtpPass = Deno.env.get("SMTP_PASS") || "";
          const smtpFrom = Deno.env.get("SMTP_FROM") || Deno.env.get("SMTP_SENDER_EMAIL") || "noreply@habittrack.com";
          const smtpFromName = Deno.env.get("SMTP_FROM_NAME") || "HabitTrack";
          
          if (!smtpHost || !smtpUser || !smtpPass) {
            errors.push(`SMTP configuration missing. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS in Edge Functions Secrets. These should match your Auth SMTP Settings.`);
            continue;
          }
          
          // Usar librería SMTP de Deno
          const { SmtpClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
          
          const client = new SmtpClient();
          
          await client.connect({
            hostname: smtpHost,
            port: smtpPort,
            username: smtpUser,
            password: smtpPass,
            tls: smtpPort === 465, // SSL para puerto 465, TLS para otros
          });
          
          await client.send({
            from: `${smtpFromName} <${smtpFrom}>`,
            to: userEmail,
            subject: `🔔 Recordatorio: Tienes ${userHabits.length} ${userHabits.length === 1 ? "hábito" : "hábitos"} pendiente${userHabits.length === 1 ? "" : "s"}`,
            content: emailText,
            html: emailHtml,
          });
          
          await client.close();
          emailsSent++;
        } catch (emailError: any) {
          errors.push(`Failed to send email to ${userEmail}: ${emailError.message}`);
        }
      } catch (error) {
        errors.push(`Error processing user ${userId}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminders processed",
        sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-habit-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

