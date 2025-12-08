create type "public"."pomodoro-type" as enum ('focus', 'break', 'long-break');

alter table "public"."pomodoros" add column "type" public."pomodoro-type" not null default 'focus'::public."pomodoro-type";


-- supabase/migrations/20251206234651_create_profiles_table.sql

-- 1. Crear la tabla 'profiles'
CREATE TABLE public.profiles (
    -- El 'id' de la tabla profiles debe ser el mismo que el 'id' del usuario en auth.users
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    
    -- Campos adicionales del perfil
    username text UNIQUE,
    fullname text,
    avatar_url text,
    
    -- Campo para llevar un registro de cuándo se actualizó el perfil
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Asegurar que solo el propietario del perfil puede verlo/editarlo (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Definir políticas de seguridad (Row Level Security)
-- Permitir que un usuario vea su propio perfil y el de otros
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( TRUE ); -- Permite SELECT a todos

-- Permitir a un usuario insertar un registro SI el 'id' es el mismo que el id de sesión
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Permitir a un usuario actualizar su propio perfil
CREATE POLICY "Users can update their own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id ); 

-- 4. Crear un índice para búsquedas rápidas por username
CREATE UNIQUE INDEX profiles_username_idx ON public.profiles (username);

-- 5. Agregar una función/trigger opcional para que la columna 'updated_at' se actualice automáticamente
-- (Esto a veces requiere funciones adicionales, pero es un buen punto de partida)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar el trigger a la tabla 'profiles'
CREATE TRIGGER update_profile_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- 6. Opcional: Crear una función para inicializar el perfil automáticamente después del sign-up.
-- Supabase Cloud lo hace con un trigger, pero en local es la mejor práctica implementarlo también.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar una nueva fila en la tabla 'profiles' con el ID del nuevo usuario.
  INSERT INTO public.profiles (id, username, fullname, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'fullname', NEW.raw_user_meta_data->>'avatar_url');
  -- Nota: NEW.raw_user_meta_data contiene los datos pasados en el signUp options: { data: {} }
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar el trigger a la tabla interna de autenticación
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();



-- Use Postgres to create a bucket for avatars.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para el Bucket 'avatars' (ya que public: false)
-- -----------------------------------------------------------

-- 1. Permitir a usuarios autenticados subir (INSERT)
CREATE POLICY "Allow authenticated user to insert their avatar"
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = split_part(name, '/', 1) -- Asegura que el path empiece con el ID del usuario
);

-- 2. Permitir a usuarios autenticados descargar su propio avatar (SELECT)
CREATE POLICY "Allow authenticated user to select their avatar"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = split_part(name, '/', 1)
);

-- 3. Permitir ver a todos si conoces la URL
-- Esto es útil para mostrar el avatar si el path es público o se maneja la URL firmada.
CREATE POLICY "Avatars are viewable by everyone"
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );
