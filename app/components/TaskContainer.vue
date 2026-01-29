<template>
  <div class="w-full max-w-sm self-center mt-2 flex flex-col justify-center">
    <div class="flex items-center justify-between p-1">
      <p class="text-lg">
        Tasks {{ sortedTasks && `(${sortedTasks.length})` }}
      </p>
      <div>
        <UPopover>
          <UButton icon="i-lucide-menu" color="neutral" variant="outline" />

          <template #content>
            <div class="p-2">
              <UCheckbox
                v-model="taskController.showArchivedTasks.value"
                label="Show archived tasks"
                alt="Show archived tasks"
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
    />
    <!-- #endregion -->

    <!-- #region List of Tasks -->
    <div
      class="w-full max-w-sm mt-4 mb-4 gap-2 flex flex-col max-h-screen overflow-y-auto custom-scrollbar"
    >
      <div
        v-for="task in sortedTasks"
        :key="task.id"
        class="flex flex-row p-1 sm:p-3 border rounded-md shadow-sm gap-1 sm:gap-2 w-72 sm:w-fit"
        :class="{ 'opacity-50': task.done }"
      >
        <div class="flex items-center gap-2 w-16">
          <UCheckbox
            :model-value="task.done ?? false"
            @update:model-value="() => taskController.handleToggleTask(task)"
            :class="{ 'line-through ': task.done }"
            :ui="{
              base: 'w-[2rem] h-[2rem] rounded-full',
              icon: 'w-4',
            }"
          />
        </div>
        <div class="flex flex-col w-full">
          <div class="flex items-start justify-between">
            <div
              class="w-48 sm:w-2/3 text-wrap whitespace-normal wrap-anywhere"
            >
              <p
                class="flex flex-wrap whitespace-normal text-wrap font-medium"
                :class="{ 'line-through ': task.done }"
                v-text="task.title"
              ></p>
            </div>

            <div class="flex gap-1">
              <UTooltip
                :text="
                  task.keep
                    ? 'Unassign from current Pomodoro'
                    : 'Assign to current Pomodoro'
                "
              >
                <UButton
                  :disabled="task.done!"
                  icon="i-lucide-timer"
                  size="xs"
                  :variant="task.keep ? 'solid' : 'ghost'"
                  :color="task.keep ? 'success' : 'neutral'"
                  @click="
                    task.keep
                      ? taskController.handleUnassignPomodoro(task.id)
                      : taskController.handleAssignPomodoro(task.id)
                  "
                />
              </UTooltip>
              <UTooltip :text="task.archived ? 'Unarchive' : 'Archive'">
                <UButton
                  icon="i-lucide-archive"
                  size="xs"
                  :variant="task.archived ? 'solid' : 'ghost'"
                  :color="task.archived ? 'warning' : 'neutral'"
                  @click="
                    task.archived
                      ? taskController.handleUnarchiveTask(task.id)
                      : taskController.handleArchiveTask(task.id)
                  "
                />
              </UTooltip>
            </div>
          </div>

          <p
            v-if="task.description"
            class="text-sm text-gray-600 cursor-pointer overflow-hidden transition-all"
            :style="{
              maxHeight: expandedDescriptions[task.id] ? 'none' : '250px',
            }"
            @click="toggleDescription(task.id)"
          >
            {{ task.description }}
          </p>

          <div class="flex gap-1 items-center">
            <div class="flex items-center gap-1">
              <UTooltip text="Manage Tag">
                <UButton
                  :disabled="task.done!"
                  icon="i-lucide-tag"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  @click="
                    manageTagModal = true;
                    modalSelectedTask = task;
                  "
                />
              </UTooltip>
            </div>
            <div class="flex items-center gap-1" v-if="task.tag">
              <UBadge size="sm" variant="soft">
                {{ task.tag.label }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- #endregion List of Tasks -->

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

const taskController = useTaskController();
const tagController = useTagController();
const { currPomodoro } = usePomodoroController();

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
