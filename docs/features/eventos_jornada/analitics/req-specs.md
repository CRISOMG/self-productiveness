# Especificaciones y Requerimientos: Analítica de Jornadas

## Objetivo

El objetivo es poder contabilizar y analizar la productividad (pomodoros completados) agrupada por los bloques de tiempo específicos del usuario, denominados "jornadas" (definidos en `shared/utils/jornada.v2.ts`).

## Lógica de Cruce de Tiempo

Los pomodoros se guardan con timestamps UTC en la base de datos (`started_at`, `finished_at`). Para agruparlos correctamente en la jornada percibida por el usuario:

1. Se debe extraer la hora local del usuario (ej. `America/Caracas`).
2. Se convierte el tiempo en minutos totales desde la medianoche: `(HORA * 60) + MINUTOS`.

## El Reto: Bloques que cruzan la medianoche

Algunas jornadas abarcan tiempos como `22:00 a 02:00`. Matemáticamente en minutos sería desde `1320` hasta `120`. Una comparación normal (`X >= 1320 AND X < 120`) fallaría.

**Solución:**
En lugar del comparador `AND`, usamos un `OR` para los bloques donde el inicio es mayor al fin (cruce de medianoche).

```sql
  CASE
    WHEN j.inicio <= j.fin THEN p.started_minutes >= j.inicio AND p.started_minutes < j.fin
    ELSE p.started_minutes >= j.inicio OR p.started_minutes < j.fin
  END
```

## Consultas de Implementación (Checkpoint)

### 1. Consulta Completa de Agrupación por Jornada

Permite ver todos los bloques y cuántos pomodoros se completaron en cada uno. Ideal para reportes agregados.

```sql
WITH jornadas_def AS (
  SELECT * FROM (VALUES
    ('matutina temprana 06:00 - 07:15', 360, 435),
    ('matutina media 07:15 - 08:30', 435, 510),
    ('matutina tardía 08:30 - 09:45', 510, 585),
    ('transición matutina - meridiana 09:45 - 11:00', 585, 660),
    ('meridiana temprana 11:00 - 12:00', 660, 720),
    ('meridiana media 12:00 - 13:00', 720, 780),
    ('meridiana tardía 13:00 - 14:00', 780, 840),
    ('transición meridiana - vespertina 14:00 - 15:00', 840, 900),
    ('vespertina temprana 15:00 - 16:00', 900, 960),
    ('vespertina media 16:00 - 17:00', 960, 1020),
    ('vespertina tardía 17:00 - 18:00', 1020, 1080),
    ('transición vespertina - nocturna 18:00 - 19:00', 1080, 1140),
    ('nocturna temprana 19:00 - 20:30', 1140, 1230),
    ('nocturna media 20:30 - 22:00', 1230, 1320),
    ('nocturna tardía 22:00 - 02:00', 1320, 120),
    ('transición nocturna - matutina 02:00 - 06:00', 120, 360)
  ) as t(nombre, inicio, fin)
),
pomodoros_with_time AS (
  SELECT
    *,
    EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Caracas') * 60 +
    EXTRACT(MINUTE FROM started_at AT TIME ZONE 'America/Caracas') as started_minutes
  FROM public.pomodoros
  WHERE started_at IS NOT NULL and state = 'finished'
)
SELECT
  j.nombre as jornada,
  count(p.id) as total_pomodoros
FROM jornadas_def j
LEFT JOIN pomodoros_with_time p ON (
  CASE
    WHEN j.inicio <= j.fin THEN p.started_minutes >= j.inicio AND p.started_minutes < j.fin
    ELSE p.started_minutes >= j.inicio OR p.started_minutes < j.fin
  END
)
GROUP BY j.nombre, j.inicio
ORDER BY j.inicio;
```

### 2. Vista Plana para Looker Studio (Sin Agrupar)

Para herramientas de BI que hacen su propio filtrado por variables (como `user_id` u `orden`), se exporta la data "cruda" anexando la jornada calculada, de modo que las gráficas puedan armarse dinámicamente.

```sql
CREATE OR REPLACE VIEW public.v_reporte_jornadas_usuarios AS
WITH jornadas_def AS (
    -- (Omitida por brevedad: Usar la misma definición CTE anterior)
),
pomodoros_with_time AS (
  SELECT
    id, user_id, state,
    EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Caracas') * 60 +
    EXTRACT(MINUTE FROM started_at AT TIME ZONE 'America/Caracas') as started_minutes
  FROM public.pomodoros
  WHERE started_at IS NOT NULL
)
SELECT
  p.user_id,
  p.state::text as estado,
  j.nombre as jornada,
  j.inicio as orden_jornada,
  p.id as pomodoro_id
FROM jornadas_def j
INNER JOIN pomodoros_with_time p ON (
  CASE
    WHEN j.inicio <= j.fin THEN p.started_minutes >= j.inicio AND p.started_minutes < j.fin
    ELSE p.started_minutes >= j.inicio OR p.started_minutes < j.fin
  END
);
```

### 3. Filtros Rápidos

Para validar bloques puntuales (ej. nocturna tardía), la alternativa veloz sin un CTE completo es usar la hora directamente extrayendo la zona local con operadores lógicos correspondientes (`OR` si cruza la medianoche):

```sql
SELECT count(*)
FROM public.pomodoros
WHERE started_at IS NOT NULL AND state != 'skipped'
  AND (
    EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Caracas') >= 22
    OR EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Caracas') < 2
  );
```
