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

export function getJornadaInfo(date: Date): {
  formatted_id: string;
  system_filename: string;
  dayFolder: string;
} {
  const hour = date.getHours();

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

  const diaSemana = DIAS[date.getDay()];

  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

  const formatted_id = `[Bitacora ${jornada.nombre} ${momento}, ${diaSemana}, ${dateStr}]`;
  const system_filename = `${date.getFullYear()}_${pad(date.getMonth() + 1)}_${pad(date.getDate())}.${pad(date.getHours())}.${pad(date.getMinutes())}`;
  const dayFolder = `${date.getFullYear()}_${pad(date.getMonth() + 1)}_${pad(date.getDate())}`;

  return { formatted_id, system_filename, dayFolder };
}

export function getAudioStoragePath(
  userId: string,
  filename: string,
  date: Date = new Date(),
) {
  const { dayFolder } = getJornadaInfo(date);
  return `${userId}/bitacora/${dayFolder}/${filename}`;
}
