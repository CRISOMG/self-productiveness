<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import * as J from "~~/shared/utils/v2/jornada";
import { useSupabaseClient } from "#imports";
import { useAuthStore } from "~/stores/auth";

const supabase = useSupabaseClient();
const authStore = useAuthStore();
const toast = useToast();

// Placeholder for logic
const scheduledNotifications = ref<any[]>([]);
const isCreating = ref(false);

const { data: notificationsData, refresh: fetchNotifications } =
  await useAsyncData(
    "scheduled_notifications",
    async () => {
      if (!authStore.user?.id) return [];
      const { data, error } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .eq("user_id", authStore.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
      return data || [];
    },
    { watch: [() => authStore.user?.id] },
  );

watchEffect(() => {
  if (notificationsData.value) {
    scheduledNotifications.value = notificationsData.value;
  }
});

const mode = ref<"custom" | "jornada">("jornada");

const frequencyOptions = [
  { label: "Una vez (One-off)", value: "once" },
  { label: "Diariamente", value: "daily" },
  { label: "Semanalmente", value: "weekly" },
  { label: "Mensualmente", value: "monthly" },
];

const selectedFrequency = ref("once");
const scheduledAt = ref<Date | undefined>(undefined);

const customTime = ref("09:00");
const customSelectedDays = ref<string[]>([]);
const customTitle = ref("");
const customBody = ref("");

const daysOfWeekOptions = [
  { label: "Lunes", value: "MO" },
  { label: "Martes", value: "TU" },
  { label: "Miércoles", value: "WE" },
  { label: "Jueves", value: "TH" },
  { label: "Viernes", value: "FR" },
  { label: "Sábado", value: "SA" },
  { label: "Domingo", value: "SU" },
];

// Generate Jornada presets based on the 16-Hour Active Model
const jornadaOptions = computed(() => {
  return J.JORNADAS.map((j) => {
    const nombreCap = j.nombre.charAt(0).toUpperCase() + j.nombre.slice(1);

    // Format hour and minute for UI display
    const formattedTime = `${j.inicioHora.toString().padStart(2, "0")}:${j.inicioMinuto.toString().padStart(2, "0")}`;

    // Format type for UI grouping or icons (optional, but good for labels)
    let typeLabel = "";
    if (j.tipo === "transicion") typeLabel = "🔄 ";
    else if (j.tipo === "descanso") typeLabel = "🌙 ";
    else typeLabel = "⚡ ";

    return {
      label: `${typeLabel}${nombreCap} (${formattedTime})`,
      value: `jornada_${j.nombre.replace(/\s+/g, "_")}`,
      rrule: `FREQ=DAILY;BYHOUR=${j.inicioHora};BYMINUTE=${j.inicioMinuto};BYSECOND=0`,
      payload: {
        title: nombreCap,
        body: j.descripcion,
      },
    };
  });
});

const selectedJornada = ref(jornadaOptions.value[0]?.value || "");

async function handleCreate() {
  if (mode.value === "jornada") {
    const preset = jornadaOptions.value.find(
      (o) => o.value === selectedJornada.value,
    );

    if (!preset) return;

    try {
      // Usar la hora y minuto del preset para el primer scheduled_at
      const now = new Date();
      // Parsear la hora del RRULE (ej. FREQ=DAILY;BYHOUR=6;BYMINUTE=0;BYSECOND=0)
      const rruleParts = preset.rrule.split(";");
      const byHourMatch = rruleParts
        .find((p) => p.startsWith("BYHOUR="))
        ?.split("=")[1];
      const byMinuteMatch = rruleParts
        .find((p) => p.startsWith("BYMINUTE="))
        ?.split("=")[1];

      const scheduledAt = new Date(now);
      if (byHourMatch && byMinuteMatch) {
        scheduledAt.setHours(
          parseInt(byHourMatch),
          parseInt(byMinuteMatch),
          0,
          0,
        );
        // Si la hora ya pasó hoy, agendar para mañana
        if (scheduledAt < now) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }
      }

      const { data, error } = await supabase
        .from("scheduled_notifications")
        .insert({
          user_id: authStore.user?.id,
          rrule: preset.rrule,
          payload_override: preset.payload,
          scheduled_at: scheduledAt.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast.add({
        title: "Recordatorio creado",
        description: `Se agendó la notificación para tu jornada ${preset.payload.title}`,
        color: "success",
      });

      await fetchNotifications();
    } catch (err: any) {
      console.error("Error creating notification:", err);
      toast.add({
        title: "Error al crear recordatorio",
        description: err.message || "Intenta nuevamente",
        color: "error",
      });
    }
  } else {
    // Generación de reglas personalizadas (Custom)
    let rrule: string | undefined = undefined;

    if (!customTime.value || !customTitle.value) {
      toast.add({
        title: "Revisa los campos",
        description: "El título y la hora son obligatorios.",
        color: "error",
      });
      return;
    }

    const [hours, minutes] = customTime.value.split(":").map(Number);
    const now = new Date();
    let computedScheduledAt = new Date(now);
    computedScheduledAt.setHours(hours, minutes, 0, 0);

    if (selectedFrequency.value === "once") {
      if (computedScheduledAt < now) {
        computedScheduledAt.setDate(computedScheduledAt.getDate() + 1);
      }
    } else if (selectedFrequency.value === "daily") {
      rrule = `FREQ=DAILY;BYHOUR=${hours};BYMINUTE=${minutes};BYSECOND=0`;
      if (computedScheduledAt < now) {
        computedScheduledAt.setDate(computedScheduledAt.getDate() + 1);
      }
    } else if (selectedFrequency.value === "weekly") {
      if (customSelectedDays.value.length === 0) {
        toast.add({
          title: "Error en recurrencia",
          description: "Selecciona al menos un día de la semana.",
          color: "error",
        });
        return;
      }
      rrule = `FREQ=WEEKLY;BYDAY=${customSelectedDays.value.join(",")};BYHOUR=${hours};BYMINUTE=${minutes};BYSECOND=0`;

      // Encontrar el próximo día de la semana válido más cercano a hoy/mañana
      const dayMap: Record<string, number> = {
        SU: 0,
        MO: 1,
        TU: 2,
        WE: 3,
        TH: 4,
        FR: 5,
        SA: 6,
      };
      let found = false;
      for (let i = 0; i < 7; i++) {
        const testDate = new Date(computedScheduledAt);
        testDate.setDate(computedScheduledAt.getDate() + i);
        const dayStr = Object.keys(dayMap).find(
          (k) => dayMap[k] === testDate.getDay(),
        );

        if (dayStr && customSelectedDays.value.includes(dayStr)) {
          // Si es hoy, verificar que la hora no haya pasado. Si ya pasó, no nos sirve hoy.
          if (i === 0 && testDate < now) {
            continue;
          }
          computedScheduledAt = testDate;
          found = true;
          break;
        }
      }
      // Fallback seguro
      if (!found) {
        computedScheduledAt.setDate(computedScheduledAt.getDate() + 1);
      }
    } else if (selectedFrequency.value === "monthly") {
      // Simplificado al día 1 del mes para esta versión
      rrule = `FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=${hours};BYMINUTE=${minutes};BYSECOND=0`;
      computedScheduledAt.setDate(1);
      if (computedScheduledAt < now) {
        computedScheduledAt.setMonth(computedScheduledAt.getMonth() + 1);
      }
    }

    try {
      const { data, error } = await supabase
        .from("scheduled_notifications")
        .insert({
          user_id: authStore.user?.id,
          rrule: rrule,
          payload_override: {
            title: customTitle.value,
            body: customBody.value || "",
          },
          scheduled_at: computedScheduledAt.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast.add({
        title: "Recordatorio creado",
        description: "Se guardó exitosamente tu notificación personalizada.",
        color: "success",
      });

      // Limpiar y resetear el form
      customTitle.value = "";
      customBody.value = "";
      customTime.value = "09:00";
      customSelectedDays.value = [];

      await fetchNotifications();
    } catch (err: any) {
      console.error("Error creating custom notification:", err);
      toast.add({
        title: "Error al crear",
        description: err.message || "Por favor, intenta de nuevo.",
        color: "error",
      });
    }
  }
  isCreating.value = false;
}

async function handleDelete(id: string) {
  try {
    const { error } = await supabase
      .from("scheduled_notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;

    toast.add({
      title: "Recordatorio eliminado",
      color: "success",
    });

    await fetchNotifications();
  } catch (err: any) {
    console.error("Error deleting notification:", err);
    toast.add({
      title: "Error al eliminar",
      description: err.message || "Intenta de nuevo",
      color: "error",
    });
  }
}
</script>

<template>
  <div class="space-y-4 pt-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-medium text-gray-900 dark:text-white">Recordatorios</h3>
        <p class="text-sm text-neutral-500">
          Gestiona tus notificaciones recurrentes o programadas.
        </p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-plus"
        @click="isCreating = !isCreating"
      >
        Crear
      </UButton>
    </div>

    <!-- Create Form -->
    <UCard v-if="isCreating" class="mb-4">
      <div class="space-y-4">
        <UFormField label="Modo de Programación">
          <URadioGroup
            v-model="mode"
            :items="[
              { label: 'Plantillas de Jornada', value: 'jornada' },
              { label: 'Personalizado', value: 'custom' },
            ]"
            orientation="horizontal"
          />
        </UFormField>

        <USeparator class="my-2" />

        <div v-if="mode === 'jornada'" class="space-y-4">
          <UFormField label="Evento de Jornada">
            <USelectMenu
              v-model="selectedJornada"
              :items="jornadaOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <p class="text-xs text-neutral-500">
            Se agendará diariamente un recordatorio basado en la hora
            seleccionada usando las jornadas del sistema.
          </p>
        </div>

        <div v-else class="space-y-4">
          <UFormField label="Frecuencia">
            <USelectMenu
              v-model="selectedFrequency"
              :items="frequencyOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Hora del Recordatorio">
            <UInput type="time" v-model="customTime" icon="i-lucide-clock" />
          </UFormField>

          <UFormField
            label="Días de la semana"
            v-if="selectedFrequency === 'weekly'"
          >
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="day in daysOfWeekOptions"
                :key="day.value"
                :variant="
                  customSelectedDays.includes(day.value) ? 'solid' : 'soft'
                "
                :color="
                  customSelectedDays.includes(day.value) ? 'primary' : 'neutral'
                "
                @click="
                  customSelectedDays.includes(day.value)
                    ? (customSelectedDays = customSelectedDays.filter(
                        (d) => d !== day.value,
                      ))
                    : customSelectedDays.push(day.value)
                "
                class="!rounded-full px-3 py-1 text-xs"
              >
                {{ day.label }}
              </UButton>
            </div>
          </UFormField>

          <USeparator class="my-4" />

          <UFormField label="Título de la Notificación" required>
            <UInput v-model="customTitle" placeholder="Ej: Beber agua" />
          </UFormField>

          <UFormField label="Mensaje (Opcional)">
            <UTextarea
              v-model="customBody"
              placeholder="Mantente hidratado durante tu jornada..."
              autoresize
            />
          </UFormField>

          <p class="text-xs text-neutral-500 mt-2">
            El sistema construirá de forma inteligente la regla de recurrencia
            exacta por ti.
          </p>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <UButton variant="ghost" color="neutral" @click="isCreating = false"
            >Cancelar</UButton
          >
          <UButton color="primary" @click="handleCreate">Guardar</UButton>
        </div>
      </div>
    </UCard>

    <USeparator v-if="!isCreating" />

    <div
      v-if="scheduledNotifications.length === 0"
      class="text-center py-8 text-neutral-500 text-sm"
    >
      No tienes notificaciones programadas.
    </div>
    <div v-else class="space-y-2">
      <UCard
        v-for="notification in scheduledNotifications"
        :key="notification.id"
        class="relative overflow-hidden group"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ notification.payload_override?.title || "Notificación" }}
              </h4>
              <UBadge
                size="xs"
                :color="
                  notification.status === 'active' ? 'success' : 'neutral'
                "
                variant="subtle"
              >
                {{ notification.status }}
              </UBadge>
            </div>
            <p class="text-sm text-neutral-500 mt-1 line-clamp-1">
              {{ notification.payload_override?.body || notification.rrule }}
            </p>
            <div class="flex items-center gap-4 mt-2 text-xs text-neutral-400">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-clock" />
                {{
                  new Date(notification.scheduled_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
              </span>
              <span class="flex items-center gap-1" v-if="notification.rrule">
                <UIcon name="i-lucide-repeat" />
                Diariamente
              </span>
            </div>
          </div>
          <div
            class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="handleDelete(notification.id)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
