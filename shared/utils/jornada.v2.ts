// shared/utils/jornada.v2.ts

// Configuración de jornadas basada en el Modelo de 16 Horas Activas (Con Offset de Sueño)
// Asumiendo despertar a las 6:00 a.m. y dormir a las 10:00 p.m. (22:00)

export type BloqueJornada = {
  nombre: string;
  inicioHora: number;
  inicioMinuto: number;
  finHora: number;
  finMinuto: number;
  tipo: "activa" | "transicion" | "descanso";
  descripcion: string;
};

export const JORNADAS: BloqueJornada[] = [
  // La Mañana (16 horas activas en marcha)
  {
    nombre: "matutina temprana",
    inicioHora: 6,
    inicioMinuto: 0,
    finHora: 7,
    finMinuto: 15,
    tipo: "activa",
    descripcion: "Despertar, café, preparar el día",
  },
  {
    nombre: "matutina media",
    inicioHora: 7,
    inicioMinuto: 15,
    finHora: 8,
    finMinuto: 30,
    tipo: "activa",
    descripcion: "Inicio de actividades, estudio o lectura",
  },
  {
    nombre: "matutina tardía",
    inicioHora: 8,
    inicioMinuto: 30,
    finHora: 9,
    finMinuto: 45,
    tipo: "activa",
    descripcion: "Deep work o clases",
  },
  {
    nombre: "transición matutina - meridiana",
    inicioHora: 9,
    inicioMinuto: 45,
    finHora: 11,
    finMinuto: 0,
    tipo: "transicion",
    descripcion: "Pausa corta, organizar logística",
  },

  // El Mediodía (El pico del día)
  {
    nombre: "meridiana temprana",
    inicioHora: 11,
    inicioMinuto: 0,
    finHora: 12,
    finMinuto: 0,
    tipo: "activa",
    descripcion: "Continuación bloque fuerte",
  },
  {
    nombre: "meridiana media",
    inicioHora: 12,
    inicioMinuto: 0,
    finHora: 13,
    finMinuto: 0,
    tipo: "activa",
    descripcion: "Almuerzo principal",
  },
  {
    nombre: "meridiana tardía",
    inicioHora: 13,
    inicioMinuto: 0,
    finHora: 14,
    finMinuto: 0,
    tipo: "activa",
    descripcion: "Retorno suave a la actividad",
  },
  {
    nombre: "transición meridiana - vespertina",
    inicioHora: 14,
    inicioMinuto: 0,
    finHora: 15,
    finMinuto: 0,
    tipo: "transicion",
    descripcion: "Cierre tareas mañana, cambio contexto",
  },

  // La Tarde (Segundo aire)
  {
    nombre: "vespertina temprana",
    inicioHora: 15,
    inicioMinuto: 0,
    finHora: 16,
    finMinuto: 0,
    tipo: "activa",
    descripcion: "Bloque de trabajo profundo 2",
  },
  {
    nombre: "vespertina media",
    inicioHora: 16,
    inicioMinuto: 0,
    finHora: 17,
    finMinuto: 0,
    tipo: "activa",
    descripcion: "Reuniones o tareas operativas",
  },
  {
    nombre: "vespertina tardía",
    inicioHora: 17,
    inicioMinuto: 0,
    finHora: 18,
    finMinuto: 0,
    tipo: "activa",
    descripcion: "Último sprint de productividad",
  },
  {
    nombre: "transición vespertina - nocturna",
    inicioHora: 18,
    inicioMinuto: 0,
    finHora: 19,
    finMinuto: 0,
    tipo: "transicion",
    descripcion: "Fin jornada, ejercicio, regreso",
  },

  // La Noche Activa (Desaceleración)
  {
    nombre: "nocturna temprana",
    inicioHora: 19,
    inicioMinuto: 0,
    finHora: 20,
    finMinuto: 30,
    tipo: "activa",
    descripcion: "Cena, tiempo en pareja",
  },
  {
    nombre: "nocturna media",
    inicioHora: 20,
    inicioMinuto: 30,
    finHora: 22,
    finMinuto: 0,
    tipo: "activa",
    descripcion: "Ocio ligero, sin pantallas complejas",
  },

  // El Bloque de Sueño (8 horas pasivas)
  {
    nombre: "nocturna tardía",
    inicioHora: 22,
    inicioMinuto: 0,
    finHora: 2,
    finMinuto: 0,
    tipo: "descanso",
    descripcion: "Sueño profundo",
  },
  {
    nombre: "transición nocturna - matutina",
    inicioHora: 2,
    inicioMinuto: 0,
    finHora: 6,
    finMinuto: 0,
    tipo: "descanso",
    descripcion: "Fase REM y preparación para despertar",
  },
];

// Nombres de días en español
export const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function getJornadaInfo(
  date: Date,
  timeZone: string = "America/Caracas",
): {
  formatted_id: string;
  system_filename: string;
  dayFolder: string;
} {
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));

  const hour = tzDate.getHours();
  const minute = tzDate.getMinutes();
  const currentTotalMinutes = hour * 60 + minute;

  // Encontrar el bloque de jornada actual
  const bloqueActual =
    JORNADAS.find((j) => {
      const inicioTotal = j.inicioHora * 60 + j.inicioMinuto;
      const finTotal = j.finHora * 60 + j.finMinuto;

      if (inicioTotal <= finTotal) {
        return (
          currentTotalMinutes >= inicioTotal && currentTotalMinutes < finTotal
        );
      } else {
        // Bloque nocturno que cruza medianoche (e.g. 22:00 a 02:00)
        return (
          currentTotalMinutes >= inicioTotal || currentTotalMinutes < finTotal
        );
      }
    }) || JORNADAS[0]!; // Fallback seguro

  const diaSemana = DIAS[tzDate.getDay()];
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${pad(tzDate.getDate())}-${pad(tzDate.getMonth() + 1)}-${tzDate.getFullYear()} ${pad(hour)}:${pad(minute)}`;

  // Capitalizamos la primera letra
  const nombreBloqueCap =
    bloqueActual.nombre.charAt(0).toUpperCase() + bloqueActual.nombre.slice(1);

  const formatted_id = `Bitacora ${nombreBloqueCap}, ${diaSemana}, ${dateStr}`;
  const system_filename = `${tzDate.getFullYear()}_${pad(tzDate.getMonth() + 1)}_${pad(tzDate.getDate())}.${pad(hour)}.${pad(minute)}`;
  const dayFolder = `${tzDate.getFullYear()}_${pad(tzDate.getMonth() + 1)}_${pad(tzDate.getDate())}`;

  return { formatted_id, system_filename, dayFolder };
}

export function getAudioStoragePath(
  userId: string,
  filename: string,
  date: Date = new Date(),
  timeZone: string = "America/Caracas",
) {
  const { dayFolder } = getJornadaInfo(date, timeZone);
  return `${userId}/bitacora/${dayFolder}/${filename}`;
}
