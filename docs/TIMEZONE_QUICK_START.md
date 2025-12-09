# 🕐 Guía Rápida: Zona Horaria con Supabase

## ✅ Cambios Realizados

1. **Instalado `date-fns-tz`** para manejo de zonas horarias
2. **Creado `src/lib/date-utils.ts`** con funciones helper
3. **Actualizado `Dashboard.tsx`** para usar las nuevas utilidades

## 🚀 Cómo Usar

### Importar las Utilidades

```typescript
import { 
  getTodayForSupabase, 
  isTodayInUserTimezone, 
  parseDateFromSupabase,
  getTodayInUserTimezone 
} from '@/lib/date-utils';
```

### Ejemplos de Uso

#### 1. Obtener "Hoy" para Supabase

```typescript
// ❌ Antes (incorrecto - puede fallar con zonas horarias)
const today = format(new Date(), "yyyy-MM-dd");

// ✅ Ahora (correcto - respeta zona horaria del usuario)
const today = getTodayForSupabase();
```

#### 2. Verificar si es "Hoy"

```typescript
// ❌ Antes
const today = format(new Date(), "yyyy-MM-dd");
const isToday = completion.completion_date === today;

// ✅ Ahora
const isToday = isTodayInUserTimezone(completion.completion_date);
```

#### 3. Parsear Fechas de Supabase

```typescript
// ❌ Antes
const date = parseISO(completion.completion_date);

// ✅ Ahora (convierte de UTC a zona horaria del usuario)
const date = parseDateFromSupabase(completion.completion_date);
```

## 📋 Funciones Disponibles

| Función | Descripción | Ejemplo |
|---------|-------------|---------|
| `getUserTimezone()` | Obtiene la zona horaria del navegador | `"Europe/Madrid"` |
| `getTodayForSupabase()` | Obtiene "hoy" formateado para Supabase (UTC) | `"2025-12-09"` |
| `getTodayInUserTimezone()` | Obtiene "hoy" como Date en zona horaria del usuario | `Date` |
| `isTodayInUserTimezone(date)` | Verifica si una fecha es "hoy" | `true/false` |
| `formatDateForSupabase(date)` | Convierte Date local a formato Supabase | `"2025-12-09"` |
| `parseDateFromSupabase(dateStr)` | Convierte fecha de Supabase a Date local | `Date` |

## 🔧 Configuración Actual

- **Supabase**: UTC (no se puede cambiar, y está bien así)
- **Cliente**: Detecta automáticamente la zona horaria del navegador
- **Conversión**: Automática entre UTC y zona horaria del usuario

## ⚠️ Notas Importantes

1. **Siempre usa las funciones helper** en lugar de `new Date()` o `format()` directamente
2. **Las fechas en Supabase** se almacenan como strings `"yyyy-MM-dd"` en UTC
3. **Las comparaciones** deben hacerse usando `isTodayInUserTimezone()` o parseando primero
4. **Los recordatorios** deben configurarse en la zona horaria del usuario

## 🐛 Troubleshooting

### Problema: Los check-ins aparecen en el día incorrecto

**Solución**: Asegúrate de usar `getTodayForSupabase()` en lugar de `format(new Date(), "yyyy-MM-dd")`

### Problema: "Hoy" no coincide con la fecha real

**Solución**: Usa `isTodayInUserTimezone()` para verificar si es hoy en la zona horaria del usuario

### Problema: Las fechas se muestran incorrectamente

**Solución**: Usa `parseDateFromSupabase()` antes de mostrar fechas de Supabase

## 📚 Más Información

Ver `docs/TIMEZONE_SETUP.md` para documentación completa y ejemplos avanzados.

