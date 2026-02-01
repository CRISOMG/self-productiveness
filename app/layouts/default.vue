<script setup lang="ts">
import TimelineModal from "~/components/timeline-modal .vue";

const openProfileModal = ref(false);
const openTimelineModal = ref(false);
const openShortcutsModal = ref(false);
const openWebhookModal = ref(false);
const openPersonalAccessTokenModal = ref(false);
const openNotesModal = ref(false);
const openPushNotificationsModal = ref(false);
</script>

<template>
  <UContainer class="mb-16 p-0">
    <AppHeader
      @open-timeline="openTimelineModal = true"
      @open-profile="openProfileModal = true"
      @open-shortcuts="openShortcutsModal = true"
      @open-webhook="openWebhookModal = true"
      @open-personal-access-token="openPersonalAccessTokenModal = true"
      @open-notes="openNotesModal = true"
      @open-push-notifications="openPushNotificationsModal = true"
    />
    <USeparator />

    <slot />

    <!-- Modals managed at layout level -->
    <template v-if="openProfileModal">
      <UserProfileModal v-model="openProfileModal" />
    </template>
    <template v-if="openTimelineModal">
      <TimelineModal v-model="openTimelineModal" />
    </template>
    <ShortcutsModal v-model="openShortcutsModal" />
    <WebhookModal v-model="openWebhookModal" />
    <PersonalAccessTokenModal v-model="openPersonalAccessTokenModal" />
    <NotesModal v-model="openNotesModal" />
    <PushNotificationsModal v-model="openPushNotificationsModal" />
  </UContainer>
</template>
