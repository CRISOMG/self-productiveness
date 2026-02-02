import postgres from "postgres";

// Usamos una única instancia lazy para toda la aplicación
// Asegúrate de definir N8N_POSTGRES_URL en tu archivo .env
// Ejemplo: postgres://user:pass@host:5432/db
export const sql = postgres(
  process.env.N8N_POSTGRES_URL || process.env.DATABASE_URL!,
);
