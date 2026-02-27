# Implementación de Notificaciones Push

Este documento detalla la arquitectura técnica y los componentes implementados para el sistema de notificaciones push en "Your Focus".

## Arquitectura General

El sistema utiliza el estándar Web Push nativo, eliminando la necesidad de SDKs externos pesados como Firebase en el frontend. La orquestación se realiza mediante Supabase (Base de datos, Edge Functions y Triggers).

### Flujo de Datos

1.  **Suscripción (Frontend):** El usuario otorga permisos y el navegador genera un objeto de suscripción. Este se guarda en la tabla `push_subscriptions`.
2.  **Evento de Disparo (Database):** Cuando un Pomodoro cambia su estado a `finished`, un trigger en PostgreSQL detecta el cambio.
3.  **Webhook (PostgreSQL):** El trigger utiliza la extensión `pg_net` para invocar la Edge Function `send-push`.
4.  **Procesamiento (Edge Function):** La función recupera todas las suscripciones del usuario, encripta el mensaje usando VAPID y lo envía a los respectivos servicios de push (Google, Mozilla, etc.).
5.  **Entrega (Service Worker):** El Service Worker del navegador recibe el evento, incluso si la pestaña está cerrada, y muestra la notificación.

---

## Componentes del Backend

### 1. Base de Datos (PostgreSQL)

- **Tabla `public.push_subscriptions`**: Almacena los endpoints y claves de encriptación por usuario.
  - `user_id`: UUID del usuario.
  - `subscription`: JSON con la data de PushManager.
  - `device_info`: String opcional para identificar el dispositivo.
- **Seguridad (RLS)**: Los usuarios solo pueden insertar, ver y eliminar sus propias suscripciones (política `auth.uid() = user_id`).

### 2. Trigger y Función de Notificación

- **Función `trigger_send_push_on_pomodoro_finished()`**:
  - Se dispara `AFTER UPDATE` en la tabla `pomodoros`.
  - Filtra cambios de estado a `finished`.
  - Recupera de forma segura el `service_role_key` desde `vault.decrypted_secrets`.
  - Realiza un POST a la Edge Function usando `net.http_post`.

### 3. Edge Function (`send-push`)

- **Ubicación**: `supabase/functions/send-push/index.ts`
- **Responsabilidades**:
  - Validar el payload del webhook.
  - Gestionar la criptografía VAPID (usando la librería `web-push`).
  - Enviar notificaciones en paralelo a múltiples dispositivos.
  - **Auto-limpieza**: Si un servicio de push devuelve error 410 (Goner) o 404, la suscripción se elimina automáticamente de la base de datos.

---

## Componentes del Frontend

### 1. Service Worker (`public/sw-push.js`)

Gestor de eventos en segundo plano:

- `push`: Escucha mensajes entrantes y usa `self.registration.showNotification`.
- `notificationclick`: Maneja la interacción del usuario, cerrando el aviso y abriendo/enfocando la aplicación en la URL correspondiente.

### 2. Composable `usePushNotifications.ts`

Centraliza la lógica de gestión:

- Verifica soporte del navegador.
- Gestiona el registro del Service Worker.
- Maneja la suscripción con `PushManager`.
- Sincroniza el estado con Supabase (upsert/delete).
- **Robustez**: Si el guardado en la base de datos falla, realiza un _rollback_ de la suscripción en el navegador para mantener la consistencia.

### 3. Interfaz de Usuario (`PushNotificationsModal.vue`)

Interfaz accesible desde el perfil de usuario para:

- Activar notificaciones en el dispositivo actual.
- Listar dispositivos ya suscritos con fecha de creación y tipo de navegador.
- Eliminar suscripciones individuales.

---

## Configuración y Seguridad

### Variables de Entorno

- **Frontend**: `VAPID_PUBLIC_KEY` (expuesta en `runtimeConfig.public`).
- **Edge Function**:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_SUBJECT` (típicamente un `mailto:`)

### Supabase Vault

Para mayor seguridad, el `service_role_key` utilizado por el trigger de la base de datos no está _hardcoded_, sino que se almacena en el Vault de Supabase y se accede mediante la vista `vault.decrypted_secrets`.

---

## Mantenimiento

Para rotar las llaves VAPID o actualizar el Service Worker, es importante recordar que los navegadores suelen cachear el worker. La implementación actual utiliza `navigator.serviceWorker.register` con el flag de `ready` para asegurar que el canal esté abierto antes de intentar suscribir.
