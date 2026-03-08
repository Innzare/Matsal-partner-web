<script lang="ts" setup>
import type { GroceryProduct } from '@/types'

const props = defineProps<{
  item: GroceryProduct
  selected?: boolean
}>()

const emit = defineEmits<{
  edit: [item: GroceryProduct]
  delete: [id: string]
  toggleAvailability: [id: string]
  select: [id: string]
}>()

const unitLabel = computed(() => {
  if (props.item.unitValue === 1) return props.item.unit
  return `${props.item.unitValue} ${props.item.unit}`
})
</script>

<template>
  <div class="pc-card" :class="{ 'pc-card--selected': selected, 'pc-card--stopped': !item.available }">
    <!-- Image -->
    <div class="pc-card__img-wrap">
      <v-img
        v-if="item.image"
        :src="item.image"
        height="152"
        cover
        class="pc-card__img"
      >
        <template v-slot:error>
          <div class="pc-card__img-fallback">
            <v-icon icon="mdi-image-off" size="28" color="grey-lighten-1" />
          </div>
        </template>
      </v-img>
      <div v-else class="pc-card__img-fallback">
        <v-icon icon="mdi-package-variant" size="28" color="grey-lighten-1" />
      </div>

      <!-- Overlays -->
      <div class="pc-card__checkbox">
        <v-checkbox
          :model-value="selected"
          density="compact"
          hide-details
          @update:model-value="emit('select', item.id)"
        />
      </div>

      <v-chip
        v-if="!item.available"
        color="red"
        size="x-small"
        variant="flat"
        class="pc-card__badge"
      >
        Стоп
      </v-chip>

      <div class="pc-card__price-tag">{{ item.price }} ₽</div>
    </div>

    <!-- Body -->
    <div class="pc-card__body">
      <p class="pc-card__name">{{ item.name }}</p>
      <p class="pc-card__desc">{{ item.description }}</p>

      <div class="pc-card__meta">
        <span class="pc-card__unit">{{ unitLabel }}</span>
        <span v-if="item.barcode" class="pc-card__barcode">{{ item.barcode }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="pc-card__footer">
      <div
        class="pc-card__status"
        :class="item.available ? 'pc-card__status--on' : 'pc-card__status--off'"
        @click.stop="emit('toggleAvailability', item.id)"
      >
        <span class="pc-card__status-dot" />
        {{ item.available ? 'Активно' : 'Стоп' }}
      </div>
      <div class="pc-card__actions">
        <button class="pc-card__action" @click.stop="emit('edit', item)">
          <v-icon icon="mdi-pencil-outline" size="16" />
        </button>
        <button class="pc-card__action pc-card__action--danger" @click.stop="emit('delete', item.id)">
          <v-icon icon="mdi-delete-outline" size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pc-card {
  background: #fff;
  border-radius: 14px;
  border: 1.5px solid #eee;
  overflow: hidden;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
}

.pc-card:hover {
  border-color: #ddd;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.pc-card--selected {
  border-color: #16a34a;
  box-shadow: 0 0 0 1px #16a34a;
}

.pc-card--stopped {
  opacity: 0.7;
}

/* Image */
.pc-card__img-wrap {
  position: relative;
  height: 152px;
  background: #f3f4f6;
}

.pc-card__img {
  height: 100%;
}

.pc-card__img-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f3f4f6;
}

.pc-card__checkbox {
  position: absolute;
  top: 4px;
  left: 4px;
}

.pc-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

.pc-card__price-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.65);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

/* Body */
.pc-card__body {
  padding: 12px 14px 8px;
  flex: 1;
}

.pc-card__name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pc-card__desc {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}

.pc-card__meta {
  display: flex;
  gap: 10px;
}

.pc-card__unit,
.pc-card__barcode {
  font-size: 11px;
  color: #9ca3af;
}

/* Footer */
.pc-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 12px;
  border-top: 1px solid #f3f4f6;
}

.pc-card__status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 3px 10px;
  border-radius: 20px;
  transition: background 0.15s;
}

.pc-card__status:hover {
  background: #f3f4f6;
}

.pc-card__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.pc-card__status--on {
  color: #16a34a;
}

.pc-card__status--on .pc-card__status-dot {
  background: #16a34a;
}

.pc-card__status--off {
  color: #dc2626;
}

.pc-card__status--off .pc-card__status-dot {
  background: #dc2626;
}

.pc-card__actions {
  display: flex;
  gap: 2px;
}

.pc-card__action {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  border: none;
  background: none;
  transition: all 0.12s;
}

.pc-card__action:hover {
  background: #f3f4f6;
  color: #374151;
}

.pc-card__action--danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* Dark Theme */
.dark .pc-card {
  background: #1e1e2e;
  border-color: #2e2e42;
}

.dark .pc-card:hover {
  border-color: #3f3f5a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.dark .pc-card__img-wrap {
  background: #252538;
}

.dark .pc-card__img-fallback {
  background: #252538;
}

.dark .pc-card__name {
  color: #e4e4e7;
}

.dark .pc-card__footer {
  border-top-color: #2e2e42;
}

.dark .pc-card__status:hover {
  background: #252538;
}

.dark .pc-card__action:hover {
  background: #252538;
  color: #e4e4e7;
}

.dark .pc-card__action--danger:hover {
  background: rgba(220, 38, 38, 0.15);
  color: #f87171;
}
</style>
