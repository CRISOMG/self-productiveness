import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Configure VAPID keys (set these in Supabase Dashboard -> Settings -> Edge Functions -> Secrets)
const vapidEmail = Deno.env.get("VAPID_EMAIL") || "mailto:admin@yourfocus.app";
const publicVapidKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const privateVapidKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(vapidEmail, publicVapidKey, privateVapidKey);

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}

interface WebhookPayload {
  type: string;
  user_id: string; // The target user
  notification?: PushNotificationPayload; // Dynamic content
  // Allows flexibility for other arbitrary data (like record from table)
  [key: string]: unknown;
}

Deno.serve(async (req) => {
  try {
    // Parse the payload from the trigger or direct invocation
    const payload: WebhookPayload = await req.json();

    const userId = payload.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "No user_id in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch all push subscriptions for this user
    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`User ${userId} has no push subscriptions`);
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: "No subscriptions" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Prepare notification payload from incoming request or use fallback
    const notificationPayload = JSON.stringify({
      title: payload.notification?.title || "Notificación de YourFocus",
      body: payload.notification?.body || "Tienes una nueva actualización.",
      icon: payload.notification?.icon || "/favicon.ico",
      badge: payload.notification?.badge || "/favicon.ico",
      url: payload.notification?.url || "/",
      timestamp: Date.now(),
    });

    // Send to all subscriptions in parallel
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, notificationPayload);
          return { id: sub.id, success: true };
        } catch (err: unknown) {
          const error = err as { statusCode?: number; message?: string };
          // Handle expired/invalid subscriptions (410 Gone, 404 Not Found)
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Subscription ${sub.id} expired, deleting...`);
            await supabaseAdmin
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
            return { id: sub.id, success: false, expired: true };
          }
          console.error(`Failed to send to ${sub.id}:`, error.message);
          return { id: sub.id, success: false, error: error.message };
        }
      }),
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    ).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        total: subscriptions.length,
        results: results.map((r) =>
          r.status === "fulfilled" ? r.value : { error: "Promise rejected" },
        ),
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
