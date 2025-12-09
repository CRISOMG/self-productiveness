// https://nuxt.com/docs/api/configuration/nuxt-config
import path from "path";
export default defineNuxtConfig({
  app: {
    head: {
      title: process.env.HEAD_APP_NAME || "Pomodoro",
    },
  },
  compatibilityDate: "2025-07-15",
  ssr: false,
  devtools: { enabled: true },
  modules: [
    "@nuxt/ui",
    "@pinia/nuxt",
    "@nuxtjs/i18n",
    "@nuxtjs/supabase",
    "@nuxt/test-utils/module",
  ],
  css: ["~/assets/css/main.css"],
  imports: {
    dirs: [
      "~/composables",
      "~/composables/*/index.{ts,js,mjs,mts}",
      "~/composables/**",
    ],
  },
  runtimeConfig: {
    public: {
      test_email: process.env.TEST_EMAIL || "",
      head_app_name: process.env.HEAD_APP_NAME || "Pomodoro",
    },
  },
  router: {
    options: {},
  },
  pinia: {
    storesDirs: ["~/stores/**"],
  },
  test: true,
  supabase: {
    clientOptions: {},
    types: path.resolve(__dirname, "app/types/database.types.ts"),
    redirectOptions: {
      login: "/login",
      callback: "/callback",

      exclude: ["/request-reset-password", "/update-password", "/sign-up"],
    },
  },
});
