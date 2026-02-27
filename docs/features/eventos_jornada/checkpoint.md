# Checkpoint: Eventos de Jornada & Notificaciones Programadas

## Estado de la Implementación (Febrero 2026)

Este documento resume el progreso y las decisiones arquitectónicas clave implementadas hasta la fecha para el sistema de Notificaciones Programadas (Scheduled Notifications) y la integración del **Modelo de 16 Horas Activas (Eventos de Jornada)**.

### 1. Arquitectura de Notificaciones (Backend & Base de Datos)

- **Migración a Cargas Útiles (Payloads) Dinámicas:** La Edge Function `send-push` fue refactorizada. Ahora ya no usa un mensaje "hardcoded" de Pomodo terminado, sino que acepta un objeto JSON `notification` dinámico (con `title`, `body`, `icon` y `url`), haciéndola reutilizable para todo el sistema.
- **Tablas de Programación y Plantillas:**
  - `notification_templates`: Creada para almacenar configuraciones reutilizables de notificaciones.
  - `scheduled_notifications`: Tabla principal para guardar reglas de recurrencia mediante formato **RRULE**, `payload_override` y zona horaria (`timezone`).
- **Patrón Fan-out de Alta Escala:**
  - Se habilitó **`pg_cron`** para buscar cada minuto (tick) notificaciones pendientes (donde `scheduled_at <= NOW()`).
  - Las notificaciones encontradas se encolan instantáneamente en **`pgmq`**, evitando bloqueos de I/O en la base de datos de Supabase si ocurren spikes masivos.
- **Microservicio `process-notification` (Edge Function):** Consumidor que extrae eventos de `pgmq`, parsea la regla usando `rrule.js` para calcular la próxima fecha de la programación actualizando `scheduled_at` en base de datos de manera recursiva en el tiempo, finalizando con un post asíncrono a `send-push`.

### 2. Frontend y Eventos de Jornada (Nuxt UI)

- **UI de Programación:** Refactorizado `app/components/PushNotificationsModal.vue` para introducir Tabs. Una de ellas, `ScheduledNotificationsTab.vue`, sirve como interfaz para administrar recordatorios.
- **Modelo de 16 Horas Activas (Offset de Sueño):**
  - Creado `/shared/utils/jornada.v2.ts` implementando el modelo biológicamente lógico en lugar de fracciones matemáticas matemáticas planas de 24 horas.
  - Define franjas de sueño profundo pasivo (22:00 a 06:00) y segmenta agresivamente las 16 horas activas en bloques como _Matutina Temprana_, _Transición Meridiana_, y _Vespertina Tardía_.
  - Las funciones `getJornadaInfo()` y `getAudioStoragePath()` de `.v2` recogen ahora el argumento opcional `timeZone` (por defecto _America/Caracas_) de forma nativa para prevenir desincronizaciones cerca de medianoche al organizar o registrar bitácoras.
- **Predeterminados de RRULE en la Tab (`ScheduledNotificationsTab.vue`):**
  - Ahora mapea dinámicamente y expone los bloques exactos de `jornada.v2.ts`.
  - Genera visualmente al usuario eventos y transiciones interactivas construyendo en silencio un `RRULE=FREQ=DAILY;BYHOUR=...;BYMINUTE=...` listo para conectar a Supabase.

### 4. Siguientes Pasos Pendientes (Next Steps)

1. **Conexión Frontend - Base de Datos:**
   Terminar la lógica real del botón _Guardar_ en la interfaz para insertar un objeto completo (Custom rule o de Jornada) en la tabla `scheduled_notifications` mediante Pinia/Supabase Client.
2. **Setup Remoto / Local:** Ejecutar localmente (o en el dashboard remoto) la migración SQL `20240223_scheduled_notifications.sql` para habilitar `pg_cron`/`pgmq` real.
3. **Flujo Cíclico de Testeo:** Insertar un job 1 minuto en el futuro de Supabase y verificar su viaje por `pg_cron` > `pgmq` > `process-notification` > `send-push`.
