<script lang="ts" setup>
defineProps<{
  label: string
  value: string | number
  icon: string
  color?: string
}>()
</script>

<template>
  <div class="d-inline-flex align-center ga-4 bg-white py-4 px-6 rounded-lg" style="min-width: 260px">
    <div class="pa-3 rounded-lg" :style="{ backgroundColor: color || '#e65100' }">
      <v-icon :icon="icon" size="large" color="white" />
    </div>
    <div>
      <p class="text-grey-darken-1 text-body-2">{{ label }}</p>
      <span class="text-h5 font-weight-bold">{{ value }}</span>
    </div>
  </div>
</template>
