# Prompt personal access token

```
como puedo generar un jwt personalizado con supabase?

necesito que ese jwt represente a un usuario autenticado y que respete las RLS de supabase.

cuando se haga auth.uid() en la deficion de la politica para rls en supabase me retorne el id del usuario o el id del api key token que podre consultar en la tabla de api keys y obtener la relacion con el usuario y asi poder realizar las operaciones crud sobre los datos del usuario.

el objetivo es poder usar la api rest de supabase con un token que genero un usario ordinario para poder hacer consultas u operaciones con sus datos desde un sistema tercero.
```

# Response

Para lograr lo que pides, necesitas crear un mecanismo de **"Personal Access Tokens" (PAT)**.

La clave aquí es que **Supabase valida cualquier JWT que esté firmado con tu `JWT Secret` del proyecto**. No es necesario que el token sea generado por el sistema de Auth (GoTrue) estándar; tú puedes "acuñar" tus propios tokens manualmente usando una Edge Function o un backend seguro.

Aquí tienes la arquitectura y los pasos para implementarlo.

### Estrategia General

1. **Base de Datos:** Una tabla `api_keys` para rastrear los tokens generados, a qué usuario pertenecen y si están activos (para poder revocar el acceso).
2. **Generación (Edge Function):** Un endpoint que recibe la petición del usuario, crea el registro en la BD y **firma un JWT** usando el secreto de tu proyecto.
3. **Payload del JWT:**

- `sub`: Pondremos el **ID del Usuario**. Esto hará que `auth.uid()` funcione nativamente con tus políticas RLS existentes.
- `jti` (JWT ID): Pondremos el **ID de la API Key**. Esto nos permitirá validar si ese token específico sigue siendo válido en la base de datos.

4. **RLS:** Una política que verifica que el usuario sea el dueño (`auth.uid()`) Y Opcionalmente que el token (`jti`) exista en la tabla de keys y esté activo.

---

### Paso 1: Crear la tabla de API Keys

Necesitamos una tabla para guardar la referencia de los tokens.

```sql
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null, -- Ejemplo: "Integración con Zapier"
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table api_keys enable row level security;

-- Política: El usuario puede ver sus propias keys
create policy "Users can view their own keys"
on api_keys for select
using (auth.uid() = user_id);

-- Política: Solo el usuario puede borrar (revocar) sus keys
create policy "Users can delete their own keys"
on api_keys for delete
using (auth.uid() = user_id);

```

### Paso 2: Crear la Supabase Edge Function para generar el Token

No puedes hacer esto desde el cliente (navegador) porque requiere el **JWT Secret**, el cual nunca debe exponerse. Usaremos una Edge Function.

Primero, inicializa la función:
`supabase functions new create-api-key`

Luego, en el código (`index.ts`), usaremos la librería `djwt` para firmar.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Instanciar cliente de Supabase (Admin para escribir en api_keys sin restricciones si es necesario,
  // o usar el contexto del usuario si prefieres)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // 2. Obtener el usuario que está solicitando el token
  // Pasamos el JWT del usuario actual en el header Authorization
  const authHeader = req.headers.get("Authorization");
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(
    authHeader?.replace("Bearer ", "") ?? "",
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { name } = await req.json(); // El nombre para identificar el token (ej: "Mi Script Python")

  // 3. Insertar el registro en la tabla api_keys
  const { data: apiKeyData, error: dbError } = await supabaseAdmin
    .from("api_keys")
    .insert({ user_id: user.sub, name: name })
    .select()
    .single();

  if (dbError) {
    return new Response(JSON.stringify({ error: dbError.message }), {
      status: 500,
    });
  }

  // 4. GENERAR EL JWT PERSONALIZADO
  // IMPORTANTE: Este token debe ser firmado con el SUPABASE_JWT_SECRET
  // Puedes encontrar este secreto en tu Dashboard > Settings > API

  const jwtSecret = Deno.env.get("JWT_SECRET"); // Debes configurar esto en tus secrets de edge functions

  if (!jwtSecret) {
    return new Response("JWT Secret not configured", { status: 500 });
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  const payload = {
    // Claims estándar de Supabase
    aud: "authenticated", // Audiencia
    role: "authenticated", // Rol (para que pase las reglas básicas de PostgREST)
    sub: user.sub, // Subject: EL ID DEL USUARIO (para que auth.uid() funcione)
    exp: getNumericDate(60 * 60 * 24 * 365), // Expiración: 1 año (ajustar según necesidad)

    // Custom Claims
    jti: apiKeyData.id, // JWT ID: El ID de la tabla api_keys
    type: "personal_access_token", // Para diferenciarlo de un login normal
  };

  const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

  return new Response(
    JSON.stringify({
      token: token,
      id: apiKeyData.id,
      name: apiKeyData.name,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
```

_Nota: Recuerda establecer el secreto: `supabase secrets set JWT_SECRET=tu_secreto_del_dashboard_`

### Paso 3: Configurar RLS para usar y validar este token

Aquí es donde ocurre la magia. Tienes dos opciones dependiendo de qué tan estricto quieras ser con la **revocación**.

#### Opción A: RLS Estándar (Alto rendimiento, revocación lenta)

Si en el payload (`sub`) pusiste el `user.sub`, tus políticas actuales seguirán funcionando tal cual:

```sql
-- Esta política funciona con el login normal Y con tu token personalizado
create policy "Select data" on my_table
using ( auth.uid() = user_id );

```

Sin embargo, si borras la key de la tabla `api_keys`, el token **sigue siendo válido** matemáticamente hasta que expire (dentro de 1 año en el ejemplo).

#### Opción B: RLS con Validación de API Key (Lo que pediste)

Para asegurarte de que el token respeta la tabla `api_keys` (y permitir revocación inmediata), debes modificar tu RLS o crear una función auxiliar.

Como el token tiene el claim `jti` (que contiene el ID de la `api_key`), podemos leerlo usando `auth.jwt()`.

**1. Crear función auxiliar para verificar validez:**

```sql
create or replace function is_valid_api_token()
returns boolean as $$
declare
  token_id uuid;
  token_type text;
begin
  -- Extraer datos del JWT actual
  token_id := (auth.jwt() ->> 'jti')::uuid;
  token_type := (auth.jwt() ->> 'type');

  -- Si es un login normal de Supabase (no tiene type personal_access_token), lo permitimos
  if token_type is null or token_type != 'personal_access_token' then
    return true;
  end if;

  -- Si es un PAT, verificamos que exista y esté activo en la tabla
  return exists (
    select 1 from api_keys
    where id = token_id
    and is_active = true
  );
end;
$$ language plpgsql security definer;

```

**2. Aplicar en tus tablas:**

```sql
create policy "Access with User ID and Valid Token"
on todos
for all
using (
  auth.uid() = user_id      -- Verifica que el ID del usuario coincida (gracias al claim 'sub')
  AND
  is_valid_api_token()      -- Verifica que el token no haya sido revocado en la tabla api_keys
);

```

### Paso 4: Uso desde el sistema tercero

El usuario ordinario genera el token (vía tu frontend que llama a la Edge Function) y lo copia. Luego, en el sistema tercero (ej. un script de Python, Postman, o un servidor Node.js), hacen:

```bash
curl -X GET 'https://tu-proyecto.supabase.co/rest/v1/todos' \
  -H "apikey: TU_ANON_KEY" \
  -H "Authorization: Bearer EL_JWT_PERSONALIZADO_GENERADO"

```

### Resumen de por qué esto cumple tus requisitos:

1. **Representa a un usuario:** Sí, porque el claim `sub` es el UUID del usuario. `auth.uid()` retornará el ID del usuario correctamente.
2. **Respeta RLS:** Sí, al tener el rol `authenticated` y el `sub` correcto, Supabase aplica las políticas automáticamente.
3. **Consulta la tabla api_keys:** Sí, usando `auth.jwt() ->> 'jti'` en tus políticas (o función helper), puedes cruzar el token con tu tabla `api_keys` para validar permisos o realizar auditoría, cumpliendo tu requerimiento de "obtener la relación con el usuario".

# Prompt Nuxt server

```
en vez de usar una edge function puedo usar un nuxt server api?
```

# Response

¡Absolutamente! De hecho, dado que ya estás trabajando con **Nuxt**, esta es una opción mucho más cómoda y centralizada. No necesitas añadir la complejidad de Deno/Edge Functions si ya tienes un servidor de Nuxt (Nitro) corriendo.

Al usar un **Nuxt Server Route**, mantienes toda tu lógica en el mismo repositorio y aprovechas el ecosistema de Node.js.

Aquí tienes cómo implementar la generación del JWT personalizado ("Personal Access Token") usando Nuxt.

### 1. Preparación

Necesitas una librería para firmar tokens en Node.js. La más estándar es `jsonwebtoken`.

```bash
npm install jsonwebtoken @types/jsonwebtoken

```

Asegúrate de tener tus variables de entorno en tu archivo `.env`. Necesitas el `SUPABASE_JWT_SECRET` (el mismo que usas para verificar tokens en Supabase, lo encuentras en el Dashboard > Settings > API).

```env
# .env
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_KEY="tu-anon-key"
SUPABASE_SERVICE_KEY="tu-service-role-key" # Necesario si la tabla api_keys tiene RLS estricto
SUPABASE_JWT_SECRET="tu-secreto-super-seguro-de-supabase"

```

### 2. Crear el Server Handler

Crea un archivo en `server/api/tokens/generate.post.ts` (o la ruta que prefieras).

Usaremos las utilidades de `@nuxtjs/supabase` (asumiendo que estás usando el módulo oficial) para obtener el usuario autenticado que hace la petición.

```typescript
// server/api/tokens/generate.post.ts
import jwt from "jsonwebtoken";
import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  // 1. Obtener el usuario que hace la petición (seguridad primero)
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage:
        "Unauthorized: Debes estar logueado para generar una API Key",
    });
  }

  // 2. Leer el body para obtener el nombre del token
  const body = await readBody(event);
  const tokenName = body.name || "Token sin nombre";

  // 3. Insertar el registro en la base de datos (Tabla api_keys)
  // Usamos el ServiceRole para asegurarnos de poder escribir, aunque RLS
  // podría permitirlo con el cliente normal, esto es más robusto para operaciones administrativas.
  const supabaseAdmin = serverSupabaseServiceRole(event);

  const { data: apiKeyData, error: dbError } = await supabaseAdmin
    .from("api_keys")
    .insert({
      user_id: user.sub,
      name: tokenName,
      is_active: true,
    })
    .select()
    .single();

  if (dbError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error creando registro: ${dbError.message}`,
    });
  }

  // 4. Firmar el JWT Personalizado
  // Aquí ocurre la magia. Usamos el secreto de Supabase.
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: "JWT Secret no configurado en servidor",
    });
  }

  const payload = {
    // Claims obligatorios para que Supabase lo acepte
    aud: "authenticated",
    role: "authenticated",
    sub: user.sub, // CRUCIAL: Esto hace que auth.uid() funcione en RLS

    // Configuración del token
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 año de validez
    iat: Math.floor(Date.now() / 1000),

    // Tus claims personalizados para enlazar con la tabla
    jti: apiKeyData.id, // ID de la key en base de datos
    type: "personal_access_token",
  };

  const token = jwt.sign(payload, jwtSecret);

  // 5. Retornar el token al cliente (solo se muestra una vez)
  return {
    token: token,
    id: apiKeyData.id,
    name: apiKeyData.name,
    message: "Guarda este token en un lugar seguro, no podrás verlo de nuevo.",
  };
});
```

### 3. Diferencias Clave con la Edge Function

Al usar Nuxt Server API en lugar de Edge Functions:

1. **Entorno:** Usas Node.js, por lo que usas `jsonwebtoken` en lugar de `djwt` (Deno). Es más común y fácil de mantener si vienes del ecosistema JS clásico.
2. **Seguridad de la Sesión:** Con `serverSupabaseUser(event)`, Nuxt valida automáticamente la cookie de sesión del navegador. En la Edge Function tenías que parsear el header `Authorization` manualmente.
3. **Latencia:** Si tu servidor Nuxt está desplegado en Vercel/Netlify cerca de tu base de datos, la latencia es mínima.

### 4. Cómo consumirlo desde tu Frontend (Vue/Nuxt)

En tu componente `.vue`:

```javascript
const createToken = async () => {
  try {
    const { data, error } = await useFetch("/api/tokens/generate", {
      method: "POST",
      body: { name: "Mi Script de Python" },
    });

    if (data.value) {
      console.log("Tu nuevo token:", data.value.token);
      // Mostrar modal para que el usuario copie el token
    }
  } catch (e) {
    console.error("Error generando token", e);
  }
};
```

### 5. Recomendación para tu RLS (Recordatorio)

Recuerda que para que esto sea seguro y revocable, debes mantener la política RLS que verifica el claim `jti` que te mencioné en la respuesta anterior:

```sql
-- En Supabase SQL Editor
create or replace function is_valid_api_token()
returns boolean as $$
begin
  -- Si el token tiene type 'personal_access_token', verificamos que exista en la tabla
  if (auth.jwt() ->> 'type') = 'personal_access_token' then
    return exists (
      select 1 from api_keys
      where id = (auth.jwt() ->> 'jti')::uuid
      and is_active = true
    );
  end if;
  -- Si no es personal (es login normal), pasa
  return true;
end;
$$ language plpgsql security definer;

```

Y usarla en tus tablas: `AND is_valid_api_token()`.

### Siguiente paso para tu proyecto

Dado que estás haciendo un clon de Pomofocus con Nuxt y Supabase, ¿te gustaría que te ayude a definir el esquema de base de datos para la tabla `api_keys` y cómo relacionarla, por ejemplo, para que un script externo pueda insertar tareas (ToDos) en tu aplicación?
