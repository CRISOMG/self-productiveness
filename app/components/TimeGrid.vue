<script setup lang="ts">
import { computed, ref } from "vue";
import type { Pomodoro } from "~/types/Pomodoro";
const currHour = ref(new Date().getHours());

const elementToScrollRef = ref<HTMLElement | null>(null);

/**
 * 2. Función que se llama para cada elemento en el v-for
 * Solo guarda el elemento si su 'hour' coincide con 'currHour'.
 */
const setHourRef = (el: any, hour: number) => {
  if (el && hour === currHour.value) {
    elementToScrollRef.value = el as HTMLElement;
  }
};

onMounted(() => {
  // 3. Esperar hasta que el DOM esté completamente renderizado
  nextTick(() => {
    if (elementToScrollRef.value) {
      elementToScrollRef.value.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  });
});

const props = withDefaults(
  defineProps<{
    startHour?: number;
    endHour?: number;
    pomodoros?: Pomodoro["Row"][];
    format24h?: boolean;
  }>(),
  {
    startHour: 0,
    endHour: 23,
    pomodoros: [],
    format24h: true,
  }
);

const hours = computed(() => {
  const h = [];
  for (let i = props.startHour; i <= props.endHour; i++) {
    h.push(i);
  }
  return h;
});

const formatHour = (hour: number) => {
  if (props.format24h) {
    return `${hour.toString().padStart(2, "0")}:00`;
  }
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h} ${ampm}`;
};
const hourInPx = 60;

// Calculate position and height for a pomodoro
const getPomodoroStyle = (pomodoro: Pomodoro["Row"]) => {
  const start = new Date(pomodoro.started_at);
  const hour = start.getHours();
  const minutes = start.getMinutes();

  // Calculate total minutes from the start of the grid
  const startMinutes = hour * hourInPx + minutes;
  const totalGridMinutes = 23 * hourInPx;

  const top = (startMinutes / totalGridMinutes) * 100;
  const currMinutes = pomodoro.timelapse / hourInPx;
  const expectedMinutes = (pomodoro?.expected_duration || 0) / hourInPx;
  const selectedMinutes =
    currMinutes > expectedMinutes ? currMinutes : expectedMinutes;
  const height = (selectedMinutes / totalGridMinutes) * 100;

  return {
    top: `calc(${top}% - 10px)`,
    height: `2rem 1rem`,
  };
};
</script>

<template>
  <div
    class="relative w-full border border-gray-200 rounded-lg overflow-hidden bg-white dark:bg-gray-900 dark:border-gray-800 h-90 overflow-y-scroll"
  >
    <!-- Grid -->
    <div
      class="relative"
      :style="{
        height: `${24 * hourInPx}px`,
        // height: 'calc(100vh - 80px)',
      }"
    >
      <div
        v-for="hour in hours"
        :key="hour"
        :ref="(el) => setHourRef(el, hour)"
        class="absolute select-none w-full border-t border-gray-100 dark:border-gray-800 flex items-baseline"
        :style="{
          top: `${((hour - startHour) / (endHour - startHour)) * 100}%`,
          height: `${hourInPx}px`,
          //   top: `${((1 - startHour) / (endHour - startHour)) * 100}%`,
        }"
      >
        <span
          class="text-xs text-gray-400 ml-2 -mt-[10px] bg-white dark:bg-gray-900 px-1"
        >
          {{ formatHour(hour) }}
        </span>
      </div>

      <!-- Pomodoros -->
      <div
        v-for="pomodoro in pomodoros"
        :key="pomodoro.id"
        class="absolute left-2 right-4 rounded-md shadow-sm border border-primary-200 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-800 p-0 flex flex-row justify-left items-baseline transition-all hover:shadow-md z-10"
        :style="getPomodoroStyle(pomodoro)"
      >
        <div
          class="select-none text-[10px] text-primary-500 dark:text-primary-400 mx-1"
        >
          {{ new Date(pomodoro.started_at).toLocaleTimeString() }} -
          {{ (pomodoro.expected_duration || 0) / 60 }}m
        </div>
        <div
          class="select-none text-xs font-medium text-primary-700 dark:text-primary-300"
        >
          {{ pomodoro.tags[0].type || "Pomodoro" }}
        </div>
      </div>
    </div>
  </div>
</template>
