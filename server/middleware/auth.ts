import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    if (user) {
      event.context.auth = { user };
    }
  } catch (error: any) {
    const message = error?.statusMessage || error?.message || "";

    // If the JWT references a user that no longer exists, clear the stale cookies
    if (message.includes("User from sub claim in JWT does not exist")) {
      console.warn(
        "[auth middleware] Stale JWT detected — clearing auth cookies.",
      );

      // Clear Supabase auth cookies so the browser stops sending the invalid token
      const cookieNames = ["sb-access-token", "sb-refresh-token"];
      for (const name of cookieNames) {
        setCookie(event, name, "", { maxAge: 0, path: "/" });
      }

      // Also try to clear project-specific cookies (sb-<ref>-auth-token pattern)
      const cookies = parseCookies(event);
      for (const cookieName of Object.keys(cookies)) {
        if (
          cookieName.startsWith("sb-") &&
          cookieName.endsWith("-auth-token")
        ) {
          setCookie(event, cookieName, "", { maxAge: 0, path: "/" });
        }
      }
    } else {
      console.error("Error fetching user:", error);
    }
  }
});
