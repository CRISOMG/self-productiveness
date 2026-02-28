# Offline Sync Queue (Pendiente)

## Objetivo

Mostrar un panel de sincronización offline con las operaciones pendientes hacia Supabase en la cabecera de la aplicación, interceptando peticiones locales a través del Service Worker y encolándolas con Background Sync para reintentar cuando regrese la conexión de red.

## Requirimientos de Arquitectura

1. **Workbox Background Sync (Service Worker)**: Intercepta las peticiones fallidas (ej. POST, PATCH, DELETE fallidos por falta de red a Supabase), las almacena en IndexedDB localmente, y las encola.
2. **Vue `useNetwork` Composable (Frontend)**: Monitorea si el usuario tiene o no conexión desde la perspectiva de VueJS (Usando `navigator.onLine` a través de `@vueuse/core`).
3. **Lectura de la Cola de IndexedDB**: Workbox expone una API `workbox-background-sync` que podemos leer desde nuestro componente Vue consultando directamente `IndexedDB` para mostrar las operaciones pendientes al usuario.

## Componentes de UI Propuestos

1. **Icono Offline en Header**: Un ícono `i-lucide-wifi-off` rojo al lado del cambio de tema. Funciona como un disparador del modal.
2. **OfflineQueueModal.vue**: Un modal interactivo que consulta el estado reactivo (`useOfflineSync`) y muestra qué operaciones están suspendidas esperando Internet.

## Desafíos Técnicos Actuales (Blocker)

> [!WARNING]
> Supabase en este proyecto está generando los IDs (Primary Keys) de manera **incremental** del lado del servidor de base de datos, en vez de usar UUIDs generados en el lado del cliente o frontend.

Esto representa un problema complejo para Workbox Background Sync en operaciones dependientes estando offline. Por ejemplo:

1. El usuario, estando offline, crea un **Proyecto** (POST /rest/v1/projects). Como está offline, Workbox captura y guarda el request. La base de datos local y la UI no saben qué ID tendrá este nuevo Proyecto.
2. El usuario, aún offline, crea una **Nota** dentro de dicho Proyecto. La UI necesita el `proyecto_id` para relacionar la nota, pero el ID aún no ha sido asignado por el backend incremental.
3. El request es encolado con un `proyecto_id` nulo o temporal, lo que causará un rechazo / error en cadena cuando se intente re-sincronizar ambos hacia el servidor.

### Posibles Soluciones Futuras a Investigar:

- **Migrar a UUID (UUIDv4 o UUIDv7)**: Permitir que el cliente genere el ID. Al mandar la petición de Proyecto y de Nota offline, el frontend ya conoce los IDs relacionados pre-construidos y la cadena de inserción en Supabase funcionará impecablemente en el reintento de Background Sync.
- **Evitar inserciones dependientes offline**: Tolerar Background Sync sólo para acciones no anidadas o actualizaciones (PATCH/DELETE) donde el ID del recurso existente ya es sabido localmente.

### Intento de Mocking Offline (Descartado)

Se intentó absorber el error de conexión (`Failed to fetch`) dentro de los repositorios y de la máquina de estados de XState (`pomodoro.machine.ts`) devolviendo un Objeto Pomodoro "falso" con un ID negativo temporal (`id: -123456`) que permitía a la UI reanudar su reloj a `RUNNING` optimísticamente mientras Workbox encolaba el request verdadero por detrás (`POST`).
No obstante, esto provocó una desalineación grave en la reactividad de la app (ej. referenciar al pomodoro por ID para acciones de detención y omisión posterior causaba errores 404 al backend, e inconsistencias en el state-machine). **La implementación offline-sync ha quedado suspendida** hasta modificar la arquitectura estructural de identificadores y dependencias.
