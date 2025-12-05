<template>
  <PomofocusClone :user_id="user?.sub" />
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const user = useSupabaseUser();
</script>
