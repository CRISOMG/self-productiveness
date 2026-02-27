import { createClient } from "jsr:@supabase/supabase-js@2";
import { rrulestr } from "https://esm.sh/rrule@2.8.1";

interface QueuePayload {
  id: string; // The ID of the scheduled_notification
}

Deno.serve(async (req) => {
  try {
    const payload: QueuePayload = await req.json();

    if (!payload.id) {
      return new Response(
        JSON.stringify({ error: "No notification ID provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Fetch the scheduled notification and its template
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from("scheduled_notifications")
      .select(
        `
        *,
        notification_templates (
          title,
          body,
          icon,
          link
        )
      `,
      )
      .eq("id", payload.id)
      .single();

    if (fetchError || !notification) {
      console.error("Error fetching notification:", fetchError);
      return new Response(JSON.stringify({ error: "Notification not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Prepare the dynamic payload
    // Priority: payload_override > inline template > default fallback
    const template = notification.notification_templates || {};
    const override = notification.payload_override || {};

    const pushPayload = {
      title: override.title || template.title || "Recordatorio de YourFocus",
      body: override.body || template.body || "Tienes una tarea pendiente.",
      icon: override.icon || template.icon || "/favicon.ico",
      badge: override.badge || template.icon || "/favicon.ico",
      url: override.link || template.link || "/",
    };

    // 3. Dispatch the push notification using the existing send-push logic
    // We invoke the other edge function via HTTP to reuse code and VAPID keys
    try {
      const sendPushRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            type: "SCHEDULED_NOTIFICATION",
            user_id: notification.user_id,
            notification: pushPayload,
          }),
        },
      );

      if (!sendPushRes.ok) {
        console.error("Failed to invoke send-push:", await sendPushRes.text());
        // We might want to retry this later, but for now we'll just log it
      }
    } catch (e) {
      console.error("Error invoking send-push:", e);
    }

    // 4. Calculate next occurrence if it's a recurring notification (RRULE)
    let nextScheduledAt = null;
    let newStatus = "active";

    if (notification.rrule) {
      try {
        const rule = rrulestr(notification.rrule);
        // Find the next occurrence strictly *after* the current scheduled time
        // We use the DB's scheduled_at as the reference to avoid drifting
        const currentScheduledAt = new Date(notification.scheduled_at);
        const nextOccurrence = rule.after(currentScheduledAt, false);

        if (nextOccurrence) {
          nextScheduledAt = nextOccurrence.toISOString();
        } else {
          // Rule has ended (e.g., reached UNTIL date)
          newStatus = "completed";
        }
      } catch (e) {
        console.error("Error parsing RRULE:", e);
        newStatus = "paused"; // Pause it if the rule is invalid to avoid infinite loops
      }
    } else {
      // It's a one-off notification
      newStatus = "completed";
    }

    // 5. Update the Database record
    const { error: updateError } = await supabaseAdmin
      .from("scheduled_notifications")
      .update({
        last_executed_at: new Date().toISOString(),
        ...(nextScheduledAt ? { scheduled_at: nextScheduledAt } : {}),
        status: newStatus,
      })
      .eq("id", notification.id);

    if (updateError) {
      console.error("Error updating notification record:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        next_run: nextScheduledAt,
        new_status: newStatus,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Process notification error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
