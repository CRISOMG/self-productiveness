import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Cargamos variables de entorno (Vitest suele hacerlo automáticamente con vitest.config.ts)
const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

describe("SQL Trigger: sync_pomodoro_expected_end", () => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  let testUserId: string;

  beforeAll(async () => {
    // Obtenemos el primer usuario disponible para los tests
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers();
    if (error || users.length === 0) {
      throw new Error(
        "No hay usuarios en la base de datos local para testear. Ejecuta 'supabase start' o crea un usuario."
      );
    }
    testUserId = (users[0] as { id: string }).id;
  });

  it("debe calcular expected_end al insertar un pomodoro activo", async () => {
    const duration = 1500; // 25 min
    const now = new Date();

    // Insertamos un pomodoro que empezó justo ahora
    const { data, error } = await supabase
      .from("pomodoros")
      .insert({
        user_id: testUserId,
        state: "current",
        expected_duration: duration,
        started_at: now.toISOString(),
        type: "focus",
      })
      .select()
      .single();

    if (error) throw error;

    expect(data.expected_end).toBeDefined();

    const expectedEnd = new Date(data.expected_end);
    const diffInSeconds = (expectedEnd.getTime() - now.getTime()) / 1000;

    // El margen de error de 2 segundos es por el procesamiento del trigger
    expect(Math.abs(diffInSeconds - duration)).toBeLessThan(2);

    // Limpieza
    await supabase.from("pomodoros").delete().eq("id", data.id);
  });

  it("debe poner expected_end en NULL cuando se pausa", async () => {
    // 1. Crear pomodoro activo
    const { data: pomodoro } = await supabase
      .from("pomodoros")
      .insert({
        user_id: testUserId,
        state: "current",
        expected_duration: 1500,
        started_at: new Date().toISOString(),
        type: "focus",
      })
      .select()
      .single();

    // 2. Pausar
    const { data: updated, error } = await supabase
      .from("pomodoros")
      .update({
        state: "paused",
        toggle_timeline: [{ at: new Date().toISOString(), type: "pause" }],
      })
      .eq("id", pomodoro.id)
      .select()
      .single();

    if (error) throw error;

    expect(updated.state).toBe("paused");
    expect(updated.expected_end).toBeNull();

    // Limpieza
    await supabase.from("pomodoros").delete().eq("id", pomodoro.id);
  });

  it("debe acumular timelapse correctamente tras una pausa", async () => {
    // Este test simula un pomodoro que empezó hace 10 seg y se pausó hace 5 seg
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

    const { data, error } = await supabase
      .from("pomodoros")
      .insert({
        user_id: testUserId,
        state: "paused",
        expected_duration: 1500,
        started_at: tenSecondsAgo,
        toggle_timeline: [{ at: fiveSecondsAgo, type: "pause" }],
        type: "focus",
      })
      .select()
      .single();

    if (error) throw error;

    // El timelapse debería ser de ~5 segundos (desde started_at hasta la pausa)
    expect(data.timelapse).toBeGreaterThanOrEqual(4);
    expect(data.timelapse).toBeLessThanOrEqual(6);

    // Limpieza
    await supabase.from("pomodoros").delete().eq("id", data.id);
  });
});
