import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Configure VAPID keys (set these in Supabase Dashboard -> Settings -> Edge Functions -> Secrets)
const vapidEmail = Deno.env.get("VAPID_EMAIL") || "mailto:admin@yourfocus.app";
const publicVapidKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const privateVapidKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(vapidEmail, publicVapidKey, privateVapidKey);

interface PomodoroRecord {
  id: number;
  user_id: string;
  state: string;
  [key: string]: unknown;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: PomodoroRecord;
  old_record: PomodoroRecord | null;
}

Deno.serve(async (req) => {
  try {
    // Parse the webhook payload from Database Webhooks
    const payload: WebhookPayload = await req.json();
    const record = payload.record;

    // Only proceed if this is a pomodoro state change to 'finished'
    if (
      payload.type !== "UPDATE" ||
      record.state !== "finished" ||
      payload.old_record?.state === "finished"
    ) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not a finish event" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const userId = record.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "No user_id in record" }), {
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

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: "¡Pomodoro Completado!",
      body: "Tu sesión de enfoque terminó. ¡Tómate un descanso!",
      icon: "/check-focus.png",
      badge: "/check-focus.png",
      url: "/",
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
