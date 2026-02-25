-- consulta base
-- CREATE OR REPLACE VIEW public.v_reporte_jornadas_usuarios with (security_invoker = on) AS
 WITH jornadas_def AS (
  SELECT * FROM (VALUES
    ('matutina temprana 06:00 - 07:15', 360, 435),                 -- 06:00 - 07:15
    ('matutina media 07:15 - 08:30', 435, 510),                    -- 07:15 - 08:30
    ('matutina tardía 08:30 - 09:45', 510, 585),                   -- 08:30 - 09:45
    ('transición matutina - meridiana 09:45 - 11:00', 585, 660),   -- 09:45 - 11:00
    ('meridiana temprana 11:00 - 12:00', 660, 720),                -- 11:00 - 12:00
    ('meridiana media 12:00 - 13:00', 720, 780),                   -- 12:00 - 13:00
    ('meridiana tardía 13:00 - 14:00', 780, 840),                  -- 13:00 - 14:00
    ('transición meridiana - vespertina 14:00 - 15:00', 840, 900), -- 14:00 - 15:00
    ('vespertina temprana 15:00 - 16:00', 900, 960),               -- 15:00 - 16:00
    ('vespertina media 16:00 - 17:00', 960, 1020),                 -- 16:00 - 17:00
    ('vespertina tardía 17:00 - 18:00', 1020, 1080),               -- 17:00 - 18:00
    ('transición vespertina - nocturna 18:00 - 19:00', 1080, 1140),-- 18:00 - 19:00
    ('nocturna temprana 19:00 - 20:30', 1140, 1230),               -- 19:00 - 20:30
    ('nocturna media 20:30 - 22:00', 1230, 1320),                  -- 20:30 - 22:00
    ('nocturna tardía 22:00 - 02:00', 1320, 120),                  -- 22:00 - 02:00 (Wraps)
    ('transición nocturna - matutina 02:00 - 06:00', 120, 360)     -- 02:00 - 06:00
  ) as t(nombre, inicio, fin)
),
pomodoros_with_time AS (
  SELECT 
    *,
    EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Caracas') * 60 + 
    EXTRACT(MINUTE FROM started_at AT TIME ZONE 'America/Caracas') as started_minutes
  FROM public.pomodoros
  WHERE started_at IS NOT NULL and user_id = '4ddb8909-ef46-4cde-8feb-8ce0a3c72564' and state = 'finished'
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

-- depuracion por jornada
SELECT *
FROM public.pomodoros
WHERE user_id = '4ddb8909-ef46-4cde-8feb-8ce0a3c72564' 
  AND started_at IS NOT NULL 
  AND state != 'skipped'
  -- Filtra donde la hora (en Caracas) sea mayor o igual a las 22:00 O menor a las 02:00
  AND (
    EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Caracas') >= 22
    OR EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Caracas') < 2
  );


-- sentencia para crear vista para experimento en looker studio
CREATE OR REPLACE VIEW public.v_reporte_jornadas_usuarios with (security_invoker = on)  AS 
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
    id,
    user_id,
    state,
    EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Caracas') * 60 + 
    EXTRACT(MINUTE FROM started_at AT TIME ZONE 'America/Caracas') as started_minutes
  FROM public.pomodoros
  WHERE started_at IS NOT NULL
)
-- IMPORTANTE: Aquí devolvemos los datos fila por fila sin agrupar todavía
-- para que Looker Studio pueda filtrar por usuario ANTES de contar.
CREATE OR REPLACE VIEW public.v_reporte_jornadas_usuarios with (security_invoker = on)  AS 
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
    id,
    user_id,
    state,
    EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Caracas') * 60 + 
    EXTRACT(MINUTE FROM started_at AT TIME ZONE 'America/Caracas') as started_minutes
  FROM public.pomodoros
  WHERE started_at IS NOT NULL
)
-- IMPORTANTE: Aquí devolvemos los datos fila por fila sin agrupar todavía
-- para que Looker Studio pueda filtrar por usuario ANTES de contar.
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