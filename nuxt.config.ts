// https://nuxt.com/docs/api/configuration/nuxt-config
import path from "path";
export default defineNuxtConfig({
  app: {
    head: {
      title: process.env.HEAD_APP_NAME || "Yourfocus",
    },
  },
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  compatibilityDate: "2025-07-15",
  ssr: true,
  devtools: { enabled: true },
  modules: [
    "@nuxt/ui",
    "@pinia/nuxt",
    "@nuxtjs/i18n",
    "@nuxtjs/supabase",
    "@nuxt/test-utils/module",
    "@nuxtjs/mdc",
    "@vueuse/nuxt",
  ],

  i18n: {
    defaultLocale: "es",
    locales: [
      { code: "es", file: "es.json", name: "Español" },
      { code: "en", file: "en.json", name: "English" },
    ],
  },
  css: ["~/assets/css/main.css"],
  imports: {
    scan: true,
    global: true,
    autoImport: true,

    dirs: [
      "~/composables",
      "~/composables/*/index.{ts,js,mjs,mts}",
      "~/composables/**",
    ],
  },

  runtimeConfig: {
    googleAiApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
    public: {
      test_email: process.env.TEST_EMAIL || "",
      head_app_name: process.env.HEAD_APP_NAME || "Yourfocus",
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
      n8nGoogleDriveInboxWebhookUrl:
        process.env.N8N_GOOGLE_DRIVE_INBOX_WEBHOOK_URL,
      n8nAuthHeader: process.env.N8N_AUTH_HEADER,
    },
    google: {
      projectId: process.env.GOOGLE_PROJECT_ID,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      folderId: process.env.DRIVE_FOLDER_ID,
    },
    n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
    n8nAuthHeader: process.env.N8N_AUTH_HEADER,
    n8nPostgresUrl: process.env.N8N_POSTGRES_URL,
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
      include: ["/", "/note/:path*"],
      exclude: [
        "/request-reset-password",
        "/update-password",
        "/sign-up",
        "/landing",
      ],
    },
    cookieOptions: {
      secure: false, // Importante para desarrollo local sin HTTPS
    },
  },

  mdc: {
    headings: {
      anchorLinks: false,
    },
    highlight: {
      // noApiRoute: true
      shikiEngine: "javascript",
    },
  },

  vite: {
    server: {
      allowedHosts: [
        "localhost",
        "0.0.0.0",
        "127.0.0.1",
        "::1",
        "adminis-odr46p5.local",
        ".local",
        "10.146.219.47",
        "10.0.0.15",
        "10.0.0.17",
        "10.0.0.14",
        "10.0.0.8",
      ],
    },
  },

  experimental: {
    asyncContext: true,
  },
});
