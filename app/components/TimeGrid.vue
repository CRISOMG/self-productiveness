<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
const currHour = ref(new Date().getHours());
const pomodoroController = usePomodoroController();
const { pomodorosListToday } = storeToRefs(pomodoroController);
const elementToScrollRef = ref<HTMLElement | null>(null);

onMounted(() => {
  pomodoroController.handleListPomodoros();
});

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

type TProps = {
  startHour?: number;
  endHour?: number;
  format24h?: boolean;
};

const _props = defineProps<TProps>();
// const _defaults = {
//   startHour: 0,
//   endHour: 23,
//   pomodoros: [],
//   format24h: true,
// };
// const props = withDefaults<TProps>(_props, _defaults);

const { startHour = 0, endHour = 23, format24h = true } = _props;

const hours = computed(() => {
  const h = [];
  for (let i = startHour; i <= endHour; i++) {
    h.push(i);
  }
  return h;
});

function getDiffInMinutes(from: string, to: string) {
  const tiempoAMinutos = (tiempoStr: string) => {
    const [horas = 0, minutos = 0] = tiempoStr.split(":").map(Number);
    return horas * 60 + minutos;
  };

  const minutosInicio = tiempoAMinutos(from);
  const minutosFin = tiempoAMinutos(to);

  if (minutosFin < minutosInicio) {
    return minutosFin + 1440 - minutosInicio;
  }

  return minutosFin - minutosInicio;
}

const to24hString = (date: Date) => {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const formatHour = (hour: number) => {
  if (true || format24h) {
    return `${hour.toString().padStart(2, "0")}:00`;
  }
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h} ${ampm}`;
};

const proportion = 2;
const hourInPx = 60 * proportion;
const caclTop = (hour: number, minutes: number) => {
  const startMinutesInPx = hour * hourInPx + minutes * proportion;
  const totalGridMinutesInPx = 23 * hourInPx;

  const top = (startMinutesInPx / totalGridMinutesInPx) * 100;

  return top;
};

const getPomodoroHeight = (pomodoro: TPomodoro) => {
  const start = new Date(pomodoro.started_at || Date.now());
  const end = new Date(
    pomodoro?.finished_at || pomodoro.expected_end || Date.now(),
  );

  const diff = getDiffInMinutes(to24hString(start), to24hString(end));

  return diff * proportion;
};

const getPomodoroStyle = (pomodoro: TPomodoro) => {
  const start = new Date(pomodoro.started_at || Date.now());
  const hour = start.getHours();
  const minutes = start.getMinutes();

  const top = caclTop(hour, minutes);
  const height = getPomodoroHeight(pomodoro);
  return {
    top: `calc(${top}%)`,
    height: `${height}px`,
  };
};
</script>

<template>
  <div
    class="relative w-full h-full border border-gray-200 rounded-lg truncate bg-white dark:bg-gray-900 dark:border-gray-800 overflow-y-scroll"
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
          class="text-sm text-gray-400 ml-2 -mt-[10px] bg-white dark:bg-gray-900 px-1 z-99999"
        >
          {{ formatHour(hour) }}
        </span>
      </div>
      <div
        class="z-99999 absolute h-0 w-full rounded-sm border border-red-500 flex flex-row justify-left transition-all hover:shadow-md"
        :style="{
          top: `calc(${caclTop(
            new Date().getHours(),
            new Date().getMinutes(),
          )}%)`,
        }"
      >
        <span
          class="z-99999 dark:bg-gray-900 absolute -top-[10px] select-none text-sm mx-2.5 text-red-500 dark:text-red-400"
        >
          {{ new Date().toString().slice(16, 21) }}
        </span>
      </div>
      <!-- Pomodoros -->
      <div
        v-for="pomodoro in pomodorosListToday"
        :key="pomodoro.id"
        class="absolute left-2 right-4 rounded-sm shadow-sm border p-0 transition-all hover:shadow-md z-10"
        :class="{
          'border-primary-200 bg-primary-50 dark:bg-green-600/50 dark:border-primary-800':
            pomodoro.type === 'focus',
          'border-secondary-200 bg-secondary-50 dark:bg-secondary-900/50 dark:border-secondary-800':
            pomodoro.type !== 'focus',
        }"
        :style="getPomodoroStyle(pomodoro)"
      >
        <div class="flex flex-row w-full h-full">
          <div
            class="flex flex-col justify-between"
            :class="{ truncate: getPomodoroHeight(pomodoro) <= 10 }"
          >
            <span
              class="relative -top-[10px] left-8 select-none text-sm mx-1"
              :class="{
                'text-transparent!': getPomodoroHeight(pomodoro) <= 10,
                'text-primary-500 dark:text-primary-400':
                  pomodoro.type === 'focus',
                'text-secondary-700 dark:text-secondary-300':
                  pomodoro.type !== 'focus',
              }"
            >
              {{ new Date(pomodoro.started_at || "").toString().slice(16, 21) }}
            </span>
            <span
              class="relative -bottom-[10px] left-17 select-none text-sm mx-1"
              :class="{
                'text-transparent!': getPomodoroHeight(pomodoro) <= 10,
                'text-primary-500 dark:text-primary-400':
                  pomodoro.type === 'focus',
                'text-secondary-700 dark:text-secondary-300':
                  pomodoro.type !== 'focus',
              }"
            >
              {{
                new Date(pomodoro.finished_at || pomodoro.expected_end)
                  .toString()
                  .slice(16, 21)
              }}
            </span>
          </div>
          <div
            class="truncate relative -top-[13px] left-17 flex flex-row justify-left items-baseline"
          >
            <div
              class="truncate select-none text-sm"
              :class="{
                'text-transparent!': getPomodoroHeight(pomodoro) <= 10,
                'text-primary-700 dark:text-primary-300':
                  pomodoro.type === 'focus',
                'text-secondary-700 dark:text-secondary-300':
                  pomodoro.type !== 'focus',
              }"
            >
              {{
                getDiffInMinutes(
                  to24hString(new Date(pomodoro.started_at || "")),
                  to24hString(new Date(pomodoro.expected_end || Date.now())),
                )
              }}m
              <!-- {{
                Math.floor(
                  (pomodoro.timelapse || pomodoro.expected_duration || 0) / 60
                )
              }}m -->
            </div>
            <div
              class="truncate select-none text-md font-medium"
              :class="{
                'text-transparent!': getPomodoroHeight(pomodoro) <= 10,
                'text-primary-700 dark:text-primary-300':
                  pomodoro.type === 'focus',
                'text-secondary-700 dark:text-secondary-300':
                  pomodoro.type !== 'focus',
              }"
            >
              {{ pomodoro.type || "Pomodoro" }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
