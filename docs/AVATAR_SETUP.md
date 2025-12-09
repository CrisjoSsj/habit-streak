# 📸 Configuración de Avatares

## ✅ Políticas de Storage Configuradas

Las políticas RLS para el bucket de avatares han sido configuradas automáticamente mediante la migración `20251210000000_setup_avatars_storage_policies.sql`.

### Políticas Aplicadas

1. **Users can upload own avatars** (INSERT)
   - Permite a usuarios autenticados subir avatares en su propia carpeta (`{userId}/`)
   - Solo pueden subir en su propia carpeta

2. **Avatars are publicly accessible** (SELECT)
   - Los avatares son públicos para que puedan ser visualizados
   - Cualquiera puede ver los avatares

3. **Users can update own avatars** (UPDATE)
   - Los usuarios pueden actualizar sus propios avatares
   - Solo en su propia carpeta

4. **Users can delete own avatars** (DELETE)
   - Los usuarios pueden eliminar sus propios avatares
   - Solo en su propia carpeta

## 🔧 Configuración del Bucket

El bucket `avatars` debe estar configurado con:

- **Nombre**: `avatars`
- **Público**: Sí (para que las imágenes sean accesibles)
- **Tamaño máximo**: 1 MB
- **Tipos permitidos**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

## 📋 Estructura de Archivos

Los avatares se almacenan con la siguiente estructura:

```
avatars/
  └── {userId}/
      └── {timestamp}.{ext}
```

Ejemplo:
```
avatars/
  └── a4de2f02-3259-4e72-ae6a-2ebadd47e9df/
      └── 1733779200000.jpg
```

## 🐛 Troubleshooting

### Error: "No tienes permisos para subir imágenes"

**Solución**: 
1. Verifica que estés autenticado correctamente
2. Asegúrate de que las políticas de Storage estén aplicadas
3. Verifica que el bucket `avatars` exista y sea público

### Error: "El bucket de avatares no está configurado"

**Solución**:
1. Ve a Supabase Dashboard > Storage
2. Crea un bucket llamado `avatars`
3. Configúralo como público
4. Aplica las políticas RLS manualmente si es necesario

### Error: "La imagen es demasiado grande"

**Solución**: 
- El tamaño máximo es 1 MB
- Comprime la imagen antes de subirla
- Usa herramientas como TinyPNG o ImageOptim

### La imagen no se muestra después de subirla

**Solución**:
1. Verifica que el bucket sea público
2. Verifica que la URL del avatar esté guardada correctamente en `profiles.avatar_url`
3. Revisa la consola del navegador para errores de CORS o permisos

## 🔍 Verificar Configuración

Para verificar que todo está configurado correctamente:

```sql
-- Verificar que el bucket existe
SELECT name, public, file_size_limit 
FROM storage.buckets 
WHERE name = 'avatars';

-- Verificar políticas (desde Supabase Dashboard > Storage > Policies)
```

## 📝 Notas

- Los avatares se almacenan en carpetas por usuario para mejor organización
- Se usa `upsert: true` para reemplazar avatares existentes
- El código maneja automáticamente la limpieza de avatares antiguos (opcional, no implementado aún)

