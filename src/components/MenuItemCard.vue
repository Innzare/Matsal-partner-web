<script lang="ts" setup>
import type { MenuItem } from '@/types'

const props = defineProps<{
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
  <div class="mi-card" :class="{ 'mi-card--selected': selected, 'mi-card--stopped': !item.available }">
    <!-- Image -->
    <div class="mi-card__img-wrap">
      <v-img
        v-if="item.image"
        :src="item.image"
        height="152"
        cover
        class="mi-card__img"
      >
        <template v-slot:error>
          <div class="mi-card__img-fallback">
            <v-icon icon="mdi-image-off" size="28" color="grey-lighten-1" />
          </div>
        </template>
      </v-img>
      <div v-else class="mi-card__img-fallback">
        <v-icon icon="mdi-food" size="28" color="grey-lighten-1" />
      </div>

      <!-- Overlays -->
      <div class="mi-card__checkbox">
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
        class="mi-card__badge"
      >
        Стоп
      </v-chip>

      <div class="mi-card__price-tag">{{ item.price }} ₽</div>
    </div>

    <!-- Body -->
    <div class="mi-card__body">
      <p class="mi-card__name">{{ item.name }}</p>
      <p class="mi-card__desc">{{ item.description }}</p>

      <div class="mi-card__meta">
        <span v-if="item.weight" class="mi-card__weight">{{ item.weight }} г</span>
        <span v-if="item.nutrition" class="mi-card__kcal">{{ item.nutrition.calories }} ккал</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="mi-card__footer">
      <div
        class="mi-card__status"
        :class="item.available ? 'mi-card__status--on' : 'mi-card__status--off'"
        @click.stop="emit('toggleAvailability', item.id)"
      >
        <span class="mi-card__status-dot" />
        {{ item.available ? 'Активно' : 'Стоп' }}
      </div>
      <div class="mi-card__actions">
        <button class="mi-card__action" @click.stop="emit('edit', item)">
          <v-icon icon="mdi-pencil-outline" size="16" />
        </button>
        <button class="mi-card__action mi-card__action--danger" @click.stop="emit('delete', item.id)">
          <v-icon icon="mdi-delete-outline" size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mi-card {
  background: #fff;
  border-radius: 14px;
  border: 1.5px solid #eee;
  overflow: hidden;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
}

.mi-card:hover {
  border-color: #ddd;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.mi-card--selected {
  border-color: #EA004B;
  box-shadow: 0 0 0 1px #EA004B;
}

.mi-card--stopped {
  opacity: 0.7;
}

/* ── Image ── */
.mi-card__img-wrap {
  position: relative;
  height: 152px;
  background: #f3f4f6;
}

.mi-card__img {
  height: 100%;
}

.mi-card__img-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f3f4f6;
}

.mi-card__checkbox {
  position: absolute;
  top: 4px;
  left: 4px;
}

.mi-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

.mi-card__price-tag {
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

/* ── Body ── */
.mi-card__body {
  padding: 12px 14px 8px;
  flex: 1;
}

.mi-card__name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mi-card__desc {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}

.mi-card__meta {
  display: flex;
  gap: 10px;
}

.mi-card__weight,
.mi-card__kcal {
  font-size: 11px;
  color: #9ca3af;
}

/* ── Footer ── */
.mi-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 12px;
  border-top: 1px solid #f3f4f6;
}

.mi-card__status {
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

.mi-card__status:hover {
  background: #f3f4f6;
}

.mi-card__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.mi-card__status--on {
  color: #16a34a;
}

.mi-card__status--on .mi-card__status-dot {
  background: #16a34a;
}

.mi-card__status--off {
  color: #dc2626;
}

.mi-card__status--off .mi-card__status-dot {
  background: #dc2626;
}

.mi-card__actions {
  display: flex;
  gap: 2px;
}

.mi-card__action {
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

.mi-card__action:hover {
  background: #f3f4f6;
  color: #374151;
}

.mi-card__action--danger:hover {
  background: #fef2f2;
  color: #dc2626;
}
</style>
