import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setup } from "@nuxt/test-utils";
import { usePomodoroCycleRepository } from "~/composables/pomodoro/use-pomodoro-repository";
import { usePomodoroService } from "~/composables/pomodoro/use-pomodoro-service";
import type { AuthTokenResponsePassword } from "@supabase/supabase-js";

describe("Pomodoro Supabase Integration", () => {
  let supabase: ReturnType<typeof useSupabaseClient>;
  let mainUserSession: AuthTokenResponsePassword["data"];
  let userWithoutFinishedCycleSession: AuthTokenResponsePassword["data"];

  beforeAll(async () => {
    supabase = useSupabaseClient();

    const { data: sessionData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: process.env.SUPABASE_TEST_USER_EMAIL || "",
        password: process.env.SUPABASE_TEST_USER_PASSWORD || "",
      });

    if (authError || !sessionData?.user) {
      throw new Error(`Fallo de autenticación: ${authError?.message}`);
    }
    mainUserSession = sessionData;

    const { data: sessionData2, error: authError2 } =
      await supabase.auth.signInWithPassword({
        email: "userwithoutfinishedcycle@yopmail.com",
        password: process.env.SUPABASE_TEST_USER_PASSWORD || "",
      });

    if (authError2 || !sessionData2?.user) {
      throw new Error(`Fallo de autenticación: ${authError2?.message}`);
    }
    userWithoutFinishedCycleSession = sessionData2;
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  it("[cycleRepository.getCurrent] debe retornar el ciclo actual", async () => {
    supabase.auth.setSession(mainUserSession.session);
    const cycleRepository = usePomodoroCycleRepository();
    const cycle = await cycleRepository.getCurrent();
    expect(cycle).toBeDefined();
  });
  it("[pomodoroService.checkIsCurrentCycleEnd] debe retornar TRUE si el ciclo tiene todos los tags requeridos para finalizar", async () => {
    supabase.auth.setSession(mainUserSession.session);
    const { checkIsCurrentCycleEnd } = usePomodoroService();
    const result = await checkIsCurrentCycleEnd();
    expect(result).toBe(true);
  });

  it("[pomodoroService.checkIsCurrentCycleEnd] debe retornar FALSE si el ciclo está incompleto", async () => {
    supabase.auth.setSession(userWithoutFinishedCycleSession.session);

    const { checkIsCurrentCycleEnd } = usePomodoroService();
    const result = await checkIsCurrentCycleEnd();
    expect(result).toBe(false);
  });

  afterEach(async () => {});
});
