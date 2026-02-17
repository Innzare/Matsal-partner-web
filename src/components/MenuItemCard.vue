<script lang="ts" setup>
import type { MenuItem } from '@/types'

defineProps<{
  item: MenuItem
  selected?: boolean
}>()

const emit = defineEmits<{
  edit: [item: MenuItem]
  delete: [id: number]
  toggleAvailability: [id: number]
  select: [id: number]
}>()
</script>

<template>
  <v-card rounded="lg" :class="{ 'border-primary': selected }" elevation="1">
    <div class="position-relative">
      <v-img
        v-if="item.image"
        :src="item.image"
        height="160"
        cover
        class="rounded-t-lg"
      >
        <template v-slot:error>
          <div class="d-flex align-center justify-center bg-grey-lighten-3 h-100">
            <v-icon icon="mdi-image-off" size="40" color="grey" />
          </div>
        </template>
      </v-img>
      <div v-else class="d-flex align-center justify-center bg-grey-lighten-3" style="height: 160px">
        <v-icon icon="mdi-food" size="40" color="grey" />
      </div>

      <v-chip
        v-if="!item.available"
        color="red"
        size="x-small"
        class="position-absolute"
        style="top: 8px; right: 8px"
      >
        Стоп
      </v-chip>

      <v-checkbox
        :model-value="selected"
        class="position-absolute"
        style="top: 0; left: 0"
        density="compact"
        hide-details
        @update:model-value="emit('select', item.id)"
      />
    </div>

    <v-card-text class="pb-2">
      <p class="font-weight-bold text-body-2 mb-1 text-truncate">{{ item.name }}</p>
      <p class="text-caption text-grey-darken-1 mb-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        {{ item.description }}
      </p>
      <div class="d-flex justify-space-between align-center">
        <span class="font-weight-bold">{{ item.price }} ₽</span>
        <span class="text-caption text-grey">{{ item.weight }} г</span>
      </div>
    </v-card-text>

    <v-card-actions class="px-4 pt-0 pb-3">
      <v-switch
        :model-value="item.available"
        color="green"
        density="compact"
        hide-details
        :label="item.available ? 'В наличии' : 'Стоп'"
        @update:model-value="emit('toggleAvailability', item.id)"
      />
      <v-spacer />
      <v-btn icon="mdi-pencil" size="small" variant="text" @click="emit('edit', item)" />
      <v-btn icon="mdi-delete" size="small" variant="text" color="red" @click="emit('delete', item.id)" />
    </v-card-actions>
  </v-card>
</template>
