# 🕐 Configuración de Zona Horaria

## Problema

Supabase almacena todas las fechas en **UTC**, pero los usuarios trabajan en sus propias zonas horarias. Esto puede causar problemas cuando:

- Un usuario completa un hábito a las 11:30 PM en su zona horaria local, pero en UTC ya es el día siguiente
- Las comparaciones de fechas no funcionan correctamente
- Los recordatorios se envían en momentos incorrectos

## Solución Implementada

### 1. Utilidades de Fecha (`src/lib/date-utils.ts`)

Se crearon funciones helper que manejan automáticamente la conversión entre UTC (Supabase) y la zona horaria del usuario:

- `getUserTimezone()`: Obtiene la zona horaria del navegador del usuario
- `getTodayInUserTimezone()`: Obtiene "hoy" en la zona horaria del usuario
- `formatDateForSupabase()`: Convierte una fecha local a formato UTC para Supabase
- `parseDateFromSupabase()`: Convierte una fecha de Supabase a la zona horaria del usuario
- `isTodayInUserTimezone()`: Verifica si una fecha es "hoy" en la zona horaria del usuario

### 2. Uso en el Código

En lugar de usar `new Date()` directamente, usa las funciones helper:

```typescript
import { getTodayForSupabase, isTodayInUserTimezone, parseDateFromSupabase } from '@/lib/date-utils';

// Obtener "hoy" formateado para Supabase
const today = getTodayForSupabase(); // "2025-12-09" en UTC

// Verificar si una fecha es "hoy"
const isToday = isTodayInUserTimezone(completion.completion_date);

// Parsear una fecha de Supabase
const localDate = parseDateFromSupabase("2025-12-09");
```

## Configuración de Supabase

### Zona Horaria del Servidor

Supabase usa **UTC** por defecto y no se puede cambiar. Esto es correcto porque:
- UTC es estándar internacional
- Permite trabajar con usuarios de diferentes zonas horarias
- Las conversiones se hacen en el cliente

### Verificar Zona Horaria Actual

```sql
SELECT current_setting('timezone') as timezone;
-- Resultado: UTC
```

## Ejemplos de Uso

### Ejemplo 1: Guardar un Check-in

```typescript
import { getTodayForSupabase } from '@/lib/date-utils';

const upsertCompletion = async (habitId: string) => {
  const today = getTodayForSupabase(); // "2025-12-09" en UTC
  
  await supabase
    .from("habit_completions")
    .upsert({
      habit_id: habitId,
      completion_date: today, // Se guarda en UTC
      is_completed: true,
    });
};
```

### Ejemplo 2: Verificar si es Hoy

```typescript
import { isTodayInUserTimezone } from '@/lib/date-utils';

const canCheckIn = (completion: HabitCompletion) => {
  // Verifica si la fecha es "hoy" en la zona horaria del usuario
  return isTodayInUserTimezone(completion.completion_date);
};
```

### Ejemplo 3: Comparar Fechas

```typescript
import { parseDateFromSupabase, getTodayInUserTimezone } from '@/lib/date-utils';

const completionDate = parseDateFromSupabase(completion.completion_date);
const today = getTodayInUserTimezone();

if (completionDate.getTime() === today.getTime()) {
  // Es hoy en la zona horaria del usuario
}
```

## Recordatorios y Zona Horaria

Los recordatorios deben configurarse en la zona horaria del usuario, pero almacenarse en UTC:

```typescript
// Usuario configura recordatorio para las 8:00 AM en su zona horaria
const reminderTime = "08:00"; // Hora local

// Al guardar, Supabase puede convertir esto automáticamente
// O puedes convertir manualmente usando date-fns-tz
```

## Troubleshooting

### Problema: Los check-ins aparecen en el día incorrecto

**Solución**: Asegúrate de usar `getTodayForSupabase()` en lugar de `format(new Date(), "yyyy-MM-dd")`

### Problema: Las comparaciones de fechas no funcionan

**Solución**: Usa `isTodayInUserTimezone()` o `parseDateFromSupabase()` antes de comparar

### Problema: Los recordatorios se envían en momentos incorrectos

**Solución**: Verifica que la hora del recordatorio esté en la zona horaria correcta del usuario

## Zonas Horarias Comunes

- **España**: `Europe/Madrid` (UTC+1 en invierno, UTC+2 en verano)
- **México**: `America/Mexico_City` (UTC-6)
- **Argentina**: `America/Argentina/Buenos_Aires` (UTC-3)
- **Colombia**: `America/Bogota` (UTC-5)

La función `getUserTimezone()` detecta automáticamente la zona horaria del navegador del usuario.

