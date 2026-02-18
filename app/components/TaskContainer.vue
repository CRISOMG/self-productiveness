<template>
  <div
    class="w-full self-center mt-2 flex flex-col justify-center"
    :class="{
      'max-w-sm': isMobile || focusMode,
      'max-w-[1280px]': !isMobile && !focusMode,
    }"
  >
    <div class="flex items-center justify-between p-1">
      <p class="text-lg">
        Tasks {{ sortedTasks && `(${sortedTasks.length})` }}
      </p>
      <div class="flex items-center gap-2">
        <!-- Focus Mode Toggle -->
        <UTooltip
          :text="focusMode ? 'Show all columns' : 'Focus on one column'"
        >
          <UButton
            :icon="focusMode ? 'i-lucide-columns-3' : 'i-lucide-focus'"
            :color="focusMode ? 'primary' : 'neutral'"
            :variant="focusMode ? 'solid' : 'subtle'"
            size="sm"
            class="cursor-pointer"
            @click="focusMode = !focusMode"
          />
        </UTooltip>
        <UPopover>
          <UButton
            icon="i-lucide-settings-2"
            color="neutral"
            variant="subtle"
            size="sm"
            class="cursor-pointer"
          />

          <template #content>
            <div class="p-2 min-w-[160px]">
              <UCheckbox
                v-model="taskController.showArchivedTasks.value"
                label="Show archived"
                size="sm"
              />
            </div>
          </template>
        </UPopover>
      </div>
    </div>
    <USeparator class="mt-4" />
    <!-- #region Add Task -->
    <template v-if="createTaskModal">
      <div class="border rounded-md p-4 flex flex-col gap-3">
        <p class="text-sm font-semibold">Add New Task</p>

        <UInput
          v-model="form.title"
          placeholder="What are you working on?"
          size="sm"
        />

        <UTextarea
          v-model="form.description"
          placeholder="Description (optional)"
          size="sm"
          :rows="2"
        />

        <div class="flex gap-2">
          <USelectMenu
            class="w-full"
            v-model="selectedTag"
            :items="tagItems"
            placeholder="Select Tag"
            searchable
            option-attribute="label"
          />
        </div>
        <div class="flex gap-2">
          <UButton @click="createTaskModal = false" color="neutral" size="sm">
            Cancel
          </UButton>
          <UButton
            @click="handleSubmit"
            :loading="taskController.isLoading.value"
            :disabled="!form.title"
            color="primary"
            size="sm"
          >
            Add
          </UButton>
        </div>
      </div>
    </template>
    <template v-else>
      <UButton
        class="flex flex-row justify-center items-center p-3 border border-dashed rounded-md shadow-sm gap-2"
        @click="createTaskModal = true"
        color="neutral"
        variant="ghost"
        size="sm"
      >
        <span class="flex items-center my-auto">
          <UIcon name="i-lucide-plus" class="size-5" />
          Add Task
        </span>
      </UButton>
    </template>
    <!-- #endregion -->

    <!-- #region Search task input  -->
    <UInput
      v-model="searchTask"
      placeholder="Search Task"
      size="sm"
      icon="i-lucide-search"
      class="mt-4"
    >
      <template v-if="searchTask?.length" #trailing>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-circle-x"
          aria-label="Clear input"
          @click="searchTask = ''"
        />
      </template>
    </UInput>
    <!-- #endregion -->

    <!-- #region Tag Filters -->
    <div class="mt-3 flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <UPopover>
          <UButton
            icon="i-lucide-filter"
            size="xs"
            color="neutral"
            variant="outline"
            :class="{ 'ring-2 ring-primary': activeFilterTagIds.length > 0 }"
          >
            Filter
          </UButton>

          <template #content>
            <div class="p-3 w-64 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Filter by Tags</span>
                <UCheckbox
                  v-model="isMultipleMode"
                  label="Multiple"
                  size="xs"
                />
              </div>
              <USelectMenu
                v-model="selectedFilterTags"
                :items="tagItems"
                :multiple="isMultipleMode"
                placeholder="Select tags..."
                searchable
                option-attribute="label"
                size="sm"
              />
            </div>
          </template>
        </UPopover>

        <span v-if="activeFilterTagIds.length" class="text-xs text-gray-500">
          {{ activeFilterTagIds.length }} active
        </span>
      </div>

      <!-- Filter badges -->
      <div v-if="filterTagsState.length" class="flex gap-1 flex-wrap">
        <UBadge
          v-for="tag in filterTagsState"
          :key="tag.id"
          size="sm"
          :variant="tag.active ? 'solid' : 'outline'"
          :color="tag.active ? 'primary' : 'neutral'"
          class="cursor-pointer select-none transition-all"
          :class="{ 'opacity-50': !tag.active }"
          @click="toggleTagFilter(tag.id)"
        >
          {{ tag.label }}
          <UButton
            icon="i-lucide-x"
            size="xs"
            variant="link"
            color="neutral"
            class="ml-1 -mr-1"
            @click.stop="removeTagFilter(tag.id)"
          />
        </UBadge>
      </div>
    </div>
    <!-- #endregion -->

    <!-- #region Kanban Board -->
    <!-- Mobile / Focus Mode: Tabs View -->
    <div v-if="isMobile || focusMode" class="sm:w-[400px] mt-4">
      <UTabs v-model="activeStage" :items="tabItems" class="">
        <template v-for="stage in STAGES" :key="stage.value" #[stage.value]>
          <div class="flex flex-col gap-2 mt-3 max-h-[100vh] overflow-y-auto">
            <TaskCard
              v-for="task in tasksByStage[stage.value]"
              :key="task.id"
              :task="task"
              :expanded-descriptions="expandedDescriptions"
              :expanded-tags-state="expandedTagsState"
              :stages="STAGES"
              @toggle-done="taskController.handleToggleTask"
              @toggle-description="toggleDescription"
              @toggle-tags="toggleTagsExpand"
              @archive="
                (id) =>
                  taskController.tasks.value.find((t) => t.id === id)?.archived
                    ? taskController.handleUnarchiveTask(id)
                    : taskController.handleArchiveTask(id)
              "
              @assign-pomodoro="
                (id) =>
                  taskController.tasks.value.find((t) => t.id === id)?.keep
                    ? taskController.handleUnassignPomodoro(id)
                    : taskController.handleAssignPomodoro(id)
              "
              @manage-tag="
                (task) => {
                  manageTagModal = true;
                  modalSelectedTask = task;
                }
              "
              @stage-change="handleStageChange"
            />
            <p
              v-if="tasksByStage[stage.value].length === 0"
              class="text-center text-muted py-8"
            >
              No tasks in {{ stage.label }}
            </p>
          </div>
        </template>
      </UTabs>
    </div>

    <!-- Desktop: Grid View -->
    <div v-else class="mt-4 grid grid-cols-4 gap-2 lg:w-[1280px]">
      <div
        v-for="stage in STAGES"
        :key="stage.value"
        class="flex flex-col w-80 bg-muted/30 rounded-lg p-2 min-h-[300px]"
      >
        <div class="flex items-center gap-2 mb-3 px-1">
          <UIcon :name="stage.icon" class="size-4" />
          <span class="font-medium text-sm">{{ stage.label }}</span>
          <UBadge size="xs" variant="subtle">{{
            tasksByStage[stage.value].length
          }}</UBadge>
        </div>
        <div
          class="flex flex-col gap-2 overflow-y-auto max-h-[60vh] custom-scrollbar"
        >
          <TaskCard
            v-for="task in tasksByStage[stage.value]"
            :key="task.id"
            :task="task"
            :expanded-descriptions="expandedDescriptions"
            :expanded-tags-state="expandedTagsState"
            :stages="STAGES"
            @toggle-done="taskController.handleToggleTask"
            @toggle-description="toggleDescription"
            @toggle-tags="toggleTagsExpand"
            @archive="
              (id) =>
                taskController.tasks.value.find((t) => t.id === id)?.archived
                  ? taskController.handleUnarchiveTask(id)
                  : taskController.handleArchiveTask(id)
            "
            @assign-pomodoro="
              (id) =>
                taskController.tasks.value.find((t) => t.id === id)?.keep
                  ? taskController.handleUnassignPomodoro(id)
                  : taskController.handleAssignPomodoro(id)
            "
            @manage-tag="
              (task) => {
                manageTagModal = true;
                modalSelectedTask = task;
              }
            "
            @stage-change="handleStageChange"
          />
          <p
            v-if="tasksByStage[stage.value].length === 0"
            class="text-center text-muted text-xs py-4"
          >
            Empty
          </p>
        </div>
      </div>
    </div>
    <!-- #endregion Kanban Board -->

    <ManageTagsModal
      v-model:open="manageTagModal"
      v-model:selected-item="modalSelectedTask.tag"
      @update:selected-item="
        (item) => {
          console.log({ item, modalSelectedTask });
          modalSelectedTask.tag_id = item.id;

          taskController.handleUpdateTask(
            modalSelectedTask.id,
            modalSelectedTask,
          );
        }
      "
    />
  </div>
</template>

<script setup lang="ts">
import { useTaskController } from "~/composables/task/use-task-controller";
import { useTagController } from "~/composables/tag/use-tag-controller";
import { usePomodoroController } from "~/composables/pomodoro/use-pomodoro-controller";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import type { Database } from "~/types/database.types";

type TaskStage = Database["public"]["Enums"]["task_stage"];

const taskController = useTaskController();
const tagController = useTagController();
const { currPomodoro } = usePomodoroController();
const { profile, handleSetTagFilterMode, handleSetActiveStage } =
  useProfileController();

// Breakpoints for responsive Kanban
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller("md");

// Kanban state
const STAGES: { value: TaskStage; label: string; icon: string }[] = [
  { value: "backlog", label: "Backlog", icon: "i-lucide-inbox" },
  { value: "to_do", label: "To Do", icon: "i-lucide-list-todo" },
  { value: "in_progress", label: "In Progress", icon: "i-lucide-loader" },
  { value: "done", label: "Done", icon: "i-lucide-check-circle" },
];

const activeStage = computed({
  get: () =>
    ((profile.value?.settings as any)?.active_stage as TaskStage) || "to_do",
  set: (val: TaskStage) => handleSetActiveStage(val),
});
const focusMode = ref(true);

// Tabs items for mobile
const tabItems = computed(() =>
  STAGES.map((s) => ({
    label: isMobile.value ? "" : s.label,
    value: s.value,
    icon: s.icon,
    slot: s.value,
  })),
);

// Group tasks by stage
const tasksByStage = computed(() => {
  const grouped: Record<TaskStage, typeof sortedTasks.value> = {
    backlog: [],
    to_do: [],
    in_progress: [],
    done: [],
    archived: [],
  };

  for (const task of sortedTasks.value) {
    const stage = (task.stage as TaskStage) || "backlog";
    if (grouped[stage]) {
      grouped[stage].push(task);
    }
  }

  return grouped;
});

// Handle stage change for a task
async function handleStageChange(taskId: string, newStage: TaskStage) {
  const task = taskController.tasks.value.find((t) => t.id === taskId);
  if (task) {
    // Auto-assign to pomodoro when moving to in_progress, unassign when leaving
    const keep = newStage === "in_progress" ? true : false;
    await taskController.handleUpdateTask(taskId, {
      ...task,
      stage: newStage,
      keep,
    });
  }
}

const route = useRoute();
const router = useRouter();

const searchTask = computed({
  get: () => (route.query.q as string) || "",
  set: (value: string) => {
    router.replace({
      query: {
        ...route.query,
        q: value || undefined,
      },
    });
  },
});

// Tag Filter Mode (single/multiple) - persisted in profile settings
const isMultipleMode = computed({
  get: () => (profile.value?.settings as any)?.tag_filter_mode === "multiple",
  set: (value: boolean) => {
    handleSetTagFilterMode(value ? "multiple" : "single");
  },
});

// Filter tags state with active/inactive toggle
type FilterTagState = { id: number; label: string; active: boolean };
const filterTagsState = ref<FilterTagState[]>([]);

// Selected tags from dropdown - syncs with filterTagsState
const selectedFilterTags = computed({
  get: () => {
    if (isMultipleMode.value) {
      return filterTagsState.value.map((t) => ({ id: t.id, label: t.label }));
    }
    const first = filterTagsState.value[0];
    return first ? { id: first.id, label: first.label } : undefined;
  },
  set: (value: any) => {
    if (isMultipleMode.value) {
      // Multiple mode - value is array
      const newTags = (value || []) as { id: number; label: string }[];
      const existingIds = new Set(filterTagsState.value.map((t) => t.id));

      // Add new tags
      for (const tag of newTags) {
        if (!existingIds.has(tag.id)) {
          filterTagsState.value.push({ ...tag, active: true });
        }
      }

      // Remove deselected tags
      const newIds = new Set(newTags.map((t) => t.id));
      filterTagsState.value = filterTagsState.value.filter((t) =>
        newIds.has(t.id),
      );
    } else {
      // Single mode - value is single object or undefined
      if (value && typeof value === "object" && "id" in value) {
        filterTagsState.value = [{ ...value, active: true }];
      } else {
        filterTagsState.value = [];
      }
    }
    syncFiltersToQuery();
  },
});

// IDs of active (toggled on) filters
const activeFilterTagIds = computed(() =>
  filterTagsState.value.filter((t) => t.active).map((t) => t.id),
);

// Toggle a filter on/off
function toggleTagFilter(tagId: number) {
  const tag = filterTagsState.value.find((t) => t.id === tagId);
  if (tag) {
    tag.active = !tag.active;
    syncFiltersToQuery();
  }
}

// Remove a filter entirely
function removeTagFilter(tagId: number) {
  filterTagsState.value = filterTagsState.value.filter((t) => t.id !== tagId);
  syncFiltersToQuery();
}

// Sync filters to query string
function syncFiltersToQuery() {
  const activeIds = activeFilterTagIds.value;
  router.replace({
    query: {
      ...route.query,
      tags: activeIds.length ? activeIds.join(",") : undefined,
    },
  });
}

// Initialize filters from query string on mount
function initFiltersFromQuery() {
  const tagsParam = route.query.tags as string;
  if (tagsParam) {
    const ids = tagsParam.split(",").map(Number).filter(Boolean);
    const userTags = tagController.userTags.value;

    filterTagsState.value = ids
      .map((id) => {
        const tag = userTags.find((t) => t.id === id);
        return tag ? { id: tag.id, label: tag.label, active: true } : null;
      })
      .filter(Boolean) as FilterTagState[];
  }
}

watch(
  () => tagController.userTags.value,
  () => {
    if (route.query.tags && filterTagsState.value.length === 0) {
      initFiltersFromQuery();
    }
  },
  { immediate: true },
);

const sortedTasks = computed(() => {
  // Filter by search term (title or description)
  const searchTerm = searchTask.value.toLowerCase().trim();
  let tasks = [...taskController.tasks.value];

  if (searchTerm) {
    tasks = tasks.filter((task) => {
      const titleMatch = task.title?.toLowerCase().includes(searchTerm);
      const descriptionMatch = task.description
        ?.toLowerCase()
        .includes(searchTerm);
      return titleMatch || descriptionMatch;
    });
  }

  // Filter by active tag filters (supports multi-tag via task.tags array)
  if (activeFilterTagIds.value.length > 0) {
    tasks = tasks.filter((task) => {
      // Check if task has any of the active filter tags
      const taskTagIds =
        task.tags?.map((t: any) => t.id) || (task.tag_id ? [task.tag_id] : []);
      if (taskTagIds.length === 0) return false;
      // Return true if task has at least one of the active filter tags
      return taskTagIds.some((tagId: number) =>
        activeFilterTagIds.value.includes(tagId),
      );
    });
  }

  return tasks.sort((a, b) => {
    // 1. Assigned to Current Pomodoro (keep=true) (First)
    const aAssigned = a.keep;
    const bAssigned = b.keep;

    if (aAssigned && !bAssigned) return -1;
    if (!aAssigned && bAssigned) return 1;

    // 2. Not Done (Middle) vs Done (Last)
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;

    // 3. Sort by created_at (newest first)
    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();
    return bDate - aDate;
  });
});

const createTaskModal = ref(false);
const manageTagModal = ref(false);

onMounted(() => {
  tagController.loadUserTags();
});

const form = reactive({
  title: "",
  description: "",
});

const selectedTag = ref<{ id: number; label: string } | undefined>(undefined);
const modalSelectedTask = ref<TTask>({} as TTask);
const expandedDescriptions = ref<Record<string, boolean>>({});

function toggleDescription(taskId: string) {
  expandedDescriptions.value[taskId] = !expandedDescriptions.value[taskId];
}

const expandedTagsState = ref<Record<string, boolean>>({});

function toggleTagsExpand(taskId: string) {
  expandedTagsState.value[taskId] = !expandedTagsState.value[taskId];
}

const tagItems = computed(() => {
  return tagController.userTags.value.map((t) => ({
    id: t.id,
    label: t.label,
  }));
});

function getTaskTag(tagId: number) {
  return tagController.userTags.value.find((t) => t.id === tagId);
}

async function handleSubmit() {
  if (!form.title.trim()) return;

  await taskController.handleCreateTask(
    form.title,
    form.description,
    selectedTag.value?.id,
  );

  // Reset form
  form.title = "";
  form.description = "";
  selectedTag.value = undefined;
  createTaskModal.value = false;
  // Keep tag? User might want to batch add. Let's keep it.
}
</script>
