// shared/utils/jornada.ts

// Configuración de jornadas
export const JORNADAS = [
  { nombre: "matutina", inicio: 5, fin: 12, cortes: [7, 10] as const },
  { nombre: "meridiana", inicio: 12, fin: 15, cortes: [13, 14] as const },
  { nombre: "vespertina", inicio: 15, fin: 20, cortes: [17, 18] as const },
  { nombre: "nocturna", inicio: 20, fin: 5, cortes: [23, 2] as const },
] as const;

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

  // Encontrar jornada (nocturna si no se encuentra otra)
  const jornada =
    JORNADAS.find((j) => {
      if (j.inicio < j.fin) {
        return hour >= j.inicio && hour < j.fin;
      } else {
        // Jornada nocturna que cruza medianoche
        return hour >= j.inicio || hour < j.fin;
      }
    }) || JORNADAS[3];

  // Determinar momento
  const [c1, c2] = jornada.cortes;
  let momento: string;

  if (jornada.inicio < jornada.fin) {
    momento =
      hour >= jornada.inicio && hour < c1
        ? "temprana"
        : hour >= c1 && hour < c2
          ? "media"
          : "tardía";
  } else {
    // Jornada nocturna
    momento = hour >= jornada.inicio || hour < c1 ? "temprana" : "media";
  }

  const diaSemana = DIAS[tzDate.getDay()];

  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${pad(tzDate.getDate())}-${pad(tzDate.getMonth() + 1)}-${tzDate.getFullYear()} ${pad(tzDate.getHours())}:${pad(tzDate.getMinutes())}`;

  const formatted_id = `Bitacora ${jornada.nombre} ${momento}, ${diaSemana}, ${dateStr}`;
  const system_filename = `${tzDate.getFullYear()}_${pad(tzDate.getMonth() + 1)}_${pad(tzDate.getDate())}.${pad(tzDate.getHours())}.${pad(tzDate.getMinutes())}`;
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
