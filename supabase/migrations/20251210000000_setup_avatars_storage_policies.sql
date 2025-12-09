-- Configurar políticas RLS para el bucket de avatares
-- Estas políticas permiten a los usuarios autenticados subir sus propios avatares

-- Política para INSERT: Los usuarios pueden subir avatares en su propia carpeta
CREATE POLICY IF NOT EXISTS "Users can upload own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para SELECT: Los avatares son públicos (para que se puedan ver)
CREATE POLICY IF NOT EXISTS "Avatars are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política para UPDATE: Los usuarios pueden actualizar sus propios avatares
CREATE POLICY IF NOT EXISTS "Users can update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para DELETE: Los usuarios pueden eliminar sus propios avatares
CREATE POLICY IF NOT EXISTS "Users can delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

