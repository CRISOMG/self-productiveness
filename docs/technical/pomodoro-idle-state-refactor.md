# Pomodoro Idle State Refactor

**Date:** 2026-02-27  
**Scope:** Database schema, state machine, service layer, UI

---

## Resumen

Se refactorizó el módulo Pomodoro para:

1. Agregar un estado `idle` al enum `pomodoro_state`
2. Renombrar `long-break` → `long_break` en el enum `pomodoro_type` (compatibilidad GraphQL)
3. Crear pomodoros reales en la base de datos con `state: idle` en lugar de objetos fake en memoria
4. Respetar la configuración `autoplay` para decidir si el siguiente pomodoro arranca automáticamente o queda en idle
5. Corregir el trigger de push notifications que enviaba `user_id` en un nivel incorrecto del payload

---

## 1. Cambios en Base de Datos

### Migraciones aplicadas (proyecto: `meneprjtfpcppidpgava`)

#### Migración 1: `add_idle_state_rename_long_break_enums`

```sql
-- Agregar 'idle' al enum pomodoro_state
ALTER TYPE pomodoro_state ADD VALUE 'idle';

-- Renombrar 'long-break' → 'long_break' en pomodoro_type
ALTER TYPE pomodoro_type RENAME VALUE 'long-break' TO 'long_break';

-- Actualizar datos existentes en pomodoros_cycles
UPDATE pomodoros_cycles
SET required_tags = array_replace(required_tags, 'long-break', 'long_break');

-- Actualizar default de required_tags
ALTER TABLE pomodoros_cycles
ALTER COLUMN required_tags SET DEFAULT '{focus,break,focus,break,focus,long_break}';
```

#### Migración 2: `update_pomodoro_default_state_idle`

```sql
ALTER TABLE pomodoros ALTER COLUMN state SET DEFAULT 'idle';
```

#### Migración 3: `fix_push_trigger_user_id`

Corregido el trigger `trigger_send_push_on_pomodoro_finished` para enviar `user_id` al nivel top del payload (antes estaba anidado dentro de `record`, causando error 400 en `send-push`).

### Archivos de schema actualizados

- `supabase/schemas/tables.sql` — Enums y defaults actualizados
- `supabase/schemas/functions_and_triggers.sql` — Trigger de push corregido

---

## 2. Tipos TypeScript

### `app/types/database.types.ts`

Regenerado con `supabase gen types typescript` para reflejar los nuevos enums.

### `app/composables/types.ts`

Corregidos los nombres de los enums:

```diff
-export type PomodoroType = Enums<"pomodoro-type">;
-export type PomodoroState = Enums<"pomodoro-state">;
+export type PomodoroType = Enums<"pomodoro_type">;
+export type PomodoroState = Enums<"pomodoro_state">;
```

---

## 3. Domain Layer

### `app/utils/pomodoro-domain.ts`

Renombradas 5 ocurrencias de `'long-break'` → `'long_break'` en constantes y enums:

- `POMODORO_TYPE_LONG_BREAK`
- `PomodoroType.LONG_BREAK`
- `DEFAULT_CYCLE_SEQUENCE`
- `durationMap`

---

## 4. Service Layer

### `app/composables/pomodoro/use-pomodoro-service.ts`

#### `startPomodoro()` — Modificado

- Acepta `state: "idle"` como estado válido
- Cuando `state === "idle"`: no genera `started_at`, `expected_end`, ni `toggle_timeline`
- Usa tipo `PomodoroType` con cast explícito

#### `activateIdlePomodoro(id: number)` — Nuevo

Actualiza un pomodoro existente con `state: "idle"` a `state: "current"`:

```typescript
async function activateIdlePomodoro(id: number) {
  // Valida que el pomodoro esté en idle
  // Actualiza: state → "current", started_at, expected_end, toggle_timeline: [start]
  return await pomodoroRepository.update(id, { ... });
}
```

#### `createNextPomodoro()` — Modificado

Respeta la configuración `autoplay` del profile:

```typescript
const autoplay =
  profile.value?.settings?.time_interval_configs?.autoplay ?? true;
const state = autoplay ? "current" : "idle";
```

---

## 5. State Machine

### `app/composables/pomodoro/pomodoro.machine.ts`

#### `fetchCurrent` actor — Simplificado

Solo busca el pomodoro actual, sin crear nada:

```typescript
[MachineActors.FETCH_CURRENT]: fromPromise(async () => {
  return await pomodoroService.getCurrentPomodoro();
}),
```

#### `CREATE_OR_RESUME` actor — Modificado

Acepta `existingIdleId`. Si se proporciona, llama `activateIdlePomodoro()` en vez de `startPomodoro()`:

```typescript
if (input.existingIdleId) {
  return await pomodoroService.activateIdlePomodoro(input.existingIdleId);
}
```

#### Estado `IDLE` — Modificado

- Eliminado `entry: assign({ pomodoro: null })` para no borrar el pomodoro idle del contexto
- Añadido entry action que inicializa el timer:

```typescript
entry: ({ context }) => {
  if (context.pomodoro) {
    timeController.setClockInSeconds(
      context.pomodoro.expected_duration || DEFAULT_DURATION_SECONDS,
    );
  }
},
```

#### `FETCHING` onDone — Guard para idle

Añadido guard explícito para `state === "idle"`:

```typescript
{ guard: ({ event }) => event.output?.state === "idle",
  target: PomodoroMachineState.IDLE,
  actions: MachineActions.ASSIGN_POMODORO },
```

#### `CREATING_NEXT` onDone — Condicional por autoplay

```typescript
onDone: [
  { guard: ({ event }) => event.output?.state === "current",
    target: PomodoroMachineState.RUNNING, ... },
  { target: PomodoroMachineState.IDLE, ... },
],
```

---

## 6. Controller

### `app/composables/pomodoro/use-pomodoro-controller.ts`

#### Inicialización — Espera al profile

El `INIT` de la máquina ahora espera a que `profile.value?.id` esté disponible:

```typescript
watch(
  () => profile.value?.id,
  async (id) => {
    if (id) {
      const current = await pomodoroService.getCurrentPomodoro();
      if (!current) {
        await pomodoroService.startPomodoro({ user_id: id, state: "idle" });
      }
      send({ type: PomodoroMachineEvent.INIT });
    }
  },
  { immediate: true },
);
```

#### `handleStartPomodoro()` — Distingue idle vs paused

```typescript
if (pomodoro.state === "idle") {
  send({ type: START, inputs: { ..., existingIdleId: pomodoro.id } });
} else if (pomodoro is running) {
  send({ type: RESUME });
} else {
  send({ type: START, inputs: { ... } });
}
```

---

## 7. UI

### `app/components/YourfocusTimer.vue`

- Loading border animation mientras se carga el pomodoro
- Type checks convertidos a computed: `isTypeOfFocus`, `isTypeOfBreak`, `isTypeOfLongBreak`
- Muestra `"..."` en el timer mientras carga
- Usa `loadingPomodoro` (singular) para el estado idle individual

---

## Diagrama de Flujo

```
App Init
  │
  ▼
watch(profile.id)
  │
  ├── getCurrentPomodoro() → existe? → send(INIT)
  │                                         │
  │                                    fetchCurrent()
  │                                         │
  │                              ┌──────────┼──────────┐
  │                              ▼          ▼          ▼
  │                          "current"    "paused"   "idle"
  │                              │          │          │
  │                          RUNNING     PAUSED      IDLE
  │                                                    │
  │                                              clockInMinutes
  │                                              se inicializa
  │
  └── no existe? → startPomodoro(idle) → send(INIT)
                                              │
                                         (mismo flujo)

Play desde IDLE
  │
  ▼
handleStartPomodoro()
  │
  ├── state === "idle" → send(START, { existingIdleId })
  │                           │
  │                    activateIdlePomodoro()
  │                           │
  │                        RUNNING
  │
  └── state === "current" → send(RESUME)

Finish/Skip
  │
  ▼
CREATING_NEXT
  │
  ├── autoplay: true → createNextPomodoro(current) → RUNNING
  └── autoplay: false → createNextPomodoro(idle) → IDLE
```

---

## Bug Fix: Push Notifications (400)

**Causa raíz:** El trigger `trigger_send_push_on_pomodoro_finished` enviaba `user_id` anidado dentro de `record`, pero `send-push` lo esperaba en el nivel top del payload.

**Fix:** Se movió `user_id` al nivel top y se añadió un objeto `notification` con título y body descriptivos.

---

## Bug Fix: Broadcast Channel Synchronization (RLS)

**Causa raíz:** El canal Realtime `pomodoro_sync:{uid}` fallaba silenciosamente porque la tabla `realtime.messages` tenía RLS habilitado pero **ninguna política de acceso** aplicada en producción. Esto causaba que `isMainHandler` nunca se inicializara en `true`, bloqueando la transición `CREATING_NEXT` en la State Machine.

**Fix:**

1. Se aplicó la migración pendiente con 5 políticas requeridas para Realtime (`SELECT`/`INSERT` para channels y presence).
2. Se expusieron las variables `connectionStatus` y `connectionError` en el controller para mostrar en la interfaz si hay problemas de sincronización de pestañas.

---

## Mejora: Autoplay Cycle End Stop

**Requisito:** El autoplay no debe continuar indefinidamente, sino detenerse al finalizar el ciclo de pomodoros (ej: Focus > Break > Focus > Break > Focus > Long Break).

**Implementación:**

- **State Machine**: Los actores `FINISH_POMODORO` y `SKIP_POMODORO` ahora evalúan `checkIsCurrentCycleEnd()` de la base de datos y retornan un flag `{ cycleEnded: boolean }`.
- **`CREATING_NEXT`**: Este estado lee el flag y se lo pasa a `CREATE_NEXT` como `forceIdle: event.output.cycleEnded`.
- **Service Layer**: `createNextPomodoro` fue actualizado para aceptar `forceIdle`. Si es true, fuerza el estado del nuevo pomodoro a `"idle"`, interrumpiendo efectivamente el ciclo continuo y requiriendo interacción manual del usuario para iniciar el siguiente bloque.
