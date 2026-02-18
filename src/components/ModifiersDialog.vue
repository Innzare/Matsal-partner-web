<script lang="ts" setup>
import type { ModifierGroup } from '@/types'

const props = defineProps<{
  modelValue: boolean
  modifierGroups: ModifierGroup[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  add: [group: Omit<ModifierGroup, 'id'>]
  update: [id: number, data: Partial<ModifierGroup>]
  delete: [id: number]
}>()

const expandedId = ref<number | null>(null)
const showAddForm = ref(false)
const deleteConfirmId = ref<number | null>(null)

// New group form
const newGroup = ref({ name: '', required: false, maxSelect: 1 })

// New modifier within a group
const addingModToGroup = ref<number | null>(null)
const newMod = ref({ name: '', price: 0 })

function addGroup() {
  if (!newGroup.value.name.trim()) return
  emit('add', {
    name: newGroup.value.name.trim(),
    required: newGroup.value.required,
    maxSelect: newGroup.value.maxSelect,
    modifiers: [],
  })
  newGroup.value = { name: '', required: false, maxSelect: 1 }
  showAddForm.value = false
}

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

function updateField(group: ModifierGroup, field: string, value: any) {
  emit('update', group.id, { [field]: value })
}

function addModifier(groupId: number) {
  if (!newMod.value.name.trim()) return
  const group = props.modifierGroups.find(g => g.id === groupId)
  if (!group) return
  const maxId = group.modifiers.reduce((max, m) => Math.max(max, m.id), 0)
  emit('update', groupId, {
    modifiers: [...group.modifiers, { id: maxId + 1, name: newMod.value.name.trim(), price: newMod.value.price }],
  })
  newMod.value = { name: '', price: 0 }
  addingModToGroup.value = null
}

function removeModifier(group: ModifierGroup, modId: number) {
  emit('update', group.id, { modifiers: group.modifiers.filter(m => m.id !== modId) })
}

function confirmDelete(id: number) {
  deleteConfirmId.value = id
}

function doDelete() {
  if (deleteConfirmId.value) {
    emit('delete', deleteConfirmId.value)
    deleteConfirmId.value = null
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="580"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="xl" class="md-dialog">
      <!-- Header -->
      <div class="md-header">
        <div>
          <p class="md-header__title">Модификаторы</p>
          <p class="md-header__sub">{{ modifierGroups.length }} групп</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" density="compact" @click="close" />
      </div>

      <v-divider />

      <v-card-text class="md-body">
        <!-- Add group button / form -->
        <div v-if="!showAddForm" class="md-add-btn" @click="showAddForm = true">
          <v-icon icon="mdi-plus" size="18" />
          <span>Добавить группу</span>
        </div>

        <div v-else class="md-add-form">
          <p class="md-add-form__title">Новая группа</p>
          <v-text-field
            v-model="newGroup.name"
            placeholder="Название группы..."
            variant="outlined"
            density="compact"
            hide-details
            autofocus
            class="mb-3"
            @keyup.enter="addGroup"
          />
          <div class="d-flex align-center ga-4 mb-3">
            <div class="d-flex align-center ga-2">
              <v-checkbox
                v-model="newGroup.required"
                hide-details
                density="compact"
                color="primary"
              />
              <span class="text-body-2">Обязательная</span>
            </div>
            <v-text-field
              v-model.number="newGroup.maxSelect"
              label="Макс. выбор"
              variant="outlined"
              density="compact"
              type="number"
              hide-details
              style="max-width: 110px"
            />
          </div>
          <div class="d-flex ga-2 justify-end">
            <v-btn variant="text" size="small" color="grey" rounded="lg" @click="showAddForm = false">Отмена</v-btn>
            <v-btn color="primary" variant="flat" size="small" rounded="lg" :disabled="!newGroup.name.trim()" @click="addGroup">Создать</v-btn>
          </div>
        </div>

        <!-- Groups -->
        <div class="md-groups">
          <div v-if="modifierGroups.length === 0" class="text-center py-8">
            <v-icon icon="mdi-tune-variant" size="40" color="grey-lighten-2" />
            <p class="text-caption text-grey mt-2">Нет групп модификаторов</p>
          </div>

          <div
            v-for="group in modifierGroups"
            :key="group.id"
            class="md-group"
            :class="{ 'md-group--expanded': expandedId === group.id }"
          >
            <!-- Group header -->
            <div class="md-group__header" @click="toggleExpand(group.id)">
              <div class="md-group__info">
                <p class="md-group__name">{{ group.name }}</p>
                <div class="md-group__badges">
                  <span v-if="group.required" class="md-badge md-badge--warn">Обязат.</span>
                  <span class="md-badge">{{ group.modifiers.length }} варианта</span>
                  <span class="md-badge">макс. {{ group.maxSelect }}</span>
                </div>
              </div>
              <div class="md-group__right">
                <button class="md-group__del" @click.stop="confirmDelete(group.id)">
                  <v-icon icon="mdi-delete-outline" size="16" />
                </button>
                <v-icon
                  :icon="expandedId === group.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  size="20"
                  color="grey"
                />
              </div>
            </div>

            <!-- Expanded content -->
            <v-expand-transition>
              <div v-if="expandedId === group.id" class="md-group__content">
                <!-- Settings -->
                <div class="md-group__settings">
                  <div class="d-flex align-center ga-2">
                    <v-checkbox
                      :model-value="group.required"
                      hide-details
                      density="compact"
                      color="primary"
                      @update:model-value="updateField(group, 'required', $event)"
                    />
                    <span class="text-body-2">Обязательная</span>
                  </div>
                  <v-text-field
                    :model-value="group.maxSelect"
                    label="Макс. выбор"
                    variant="outlined"
                    density="compact"
                    type="number"
                    hide-details
                    style="max-width: 110px"
                    @update:model-value="updateField(group, 'maxSelect', Number($event))"
                  />
                </div>

                <!-- Modifiers list -->
                <div class="md-mods">
                  <div
                    v-for="mod in group.modifiers"
                    :key="mod.id"
                    class="md-mod"
                  >
                    <span class="md-mod__name">{{ mod.name }}</span>
                    <span class="md-mod__price" :class="{ 'md-mod__price--free': !mod.price }">
                      {{ mod.price ? '+' + mod.price + ' ₽' : 'Бесплатно' }}
                    </span>
                    <button class="md-mod__remove" @click="removeModifier(group, mod.id)">
                      <v-icon icon="mdi-close" size="14" />
                    </button>
                  </div>

                  <p v-if="group.modifiers.length === 0" class="text-caption text-grey py-2">
                    Нет вариантов
                  </p>
                </div>

                <!-- Add modifier -->
                <div v-if="addingModToGroup === group.id" class="md-add-mod">
                  <v-text-field
                    v-model="newMod.name"
                    placeholder="Название..."
                    variant="outlined"
                    density="compact"
                    hide-details
                    autofocus
                    class="md-add-mod__name"
                    @keyup.enter="addModifier(group.id)"
                  />
                  <v-text-field
                    v-model.number="newMod.price"
                    placeholder="0"
                    variant="outlined"
                    density="compact"
                    type="number"
                    hide-details
                    suffix="₽"
                    class="md-add-mod__price"
                  />
                  <button class="md-add-mod__btn md-add-mod__btn--ok" @click="addModifier(group.id)">
                    <v-icon icon="mdi-check" size="16" />
                  </button>
                  <button class="md-add-mod__btn" @click="addingModToGroup = null">
                    <v-icon icon="mdi-close" size="16" />
                  </button>
                </div>
                <button
                  v-else
                  class="md-add-mod-trigger"
                  @click="addingModToGroup = group.id; newMod = { name: '', price: 0 }"
                >
                  <v-icon icon="mdi-plus" size="16" />
                  Добавить вариант
                </button>
              </div>
            </v-expand-transition>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      :model-value="deleteConfirmId !== null"
      title="Удалить группу модификаторов?"
      text="Группа будет удалена из всех позиций меню."
      confirm-text="Удалить"
      confirm-color="red"
      @confirm="doDelete"
      @cancel="deleteConfirmId = null"
      @update:model-value="!$event && (deleteConfirmId = null)"
    />
  </v-dialog>
</template>

<style scoped>
.md-dialog {
  overflow: hidden;
}

/* ── Header ── */
.md-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
}

.md-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.md-header__sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ── Body ── */
.md-body {
  padding: 0 !important;
}

/* ── Add button ── */
.md-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 16px 20px;
  padding: 10px;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.md-add-btn:hover {
  border-color: #EA004B;
  color: #EA004B;
  background: #fef2f5;
}

/* ── Add form ── */
.md-add-form {
  margin: 16px 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.md-add-form__title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
}

/* ── Groups ── */
.md-groups {
  padding: 4px 12px 16px;
}

.md-group {
  border: 1.5px solid #eee;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: border-color 0.15s;
  overflow: hidden;
}

.md-group--expanded {
  border-color: #d1d5db;
}

.md-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.1s;
}

.md-group__header:hover {
  background: #fafafa;
}

.md-group__info {
  flex: 1;
  min-width: 0;
}

.md-group__name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.md-group__badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.md-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
}

.md-badge--warn {
  background: #fff7ed;
  color: #ea580c;
}

.md-group__right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.md-group__del {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: none;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.1s;
}

.md-group__del:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* ── Content ── */
.md-group__content {
  border-top: 1px solid #f3f4f6;
  padding: 14px;
}

.md-group__settings {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

/* ── Modifiers list ── */
.md-mods {
  margin-bottom: 8px;
}

.md-mod {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  transition: background 0.1s;
}

.md-mod:hover {
  background: #f9fafb;
}

.md-mod__name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.md-mod__price {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
}

.md-mod__price--free {
  color: #9ca3af;
  font-weight: 400;
}

.md-mod__remove {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: none;
  color: #d1d5db;
  cursor: pointer;
  opacity: 0;
  transition: all 0.1s;
}

.md-mod:hover .md-mod__remove {
  opacity: 1;
}

.md-mod__remove:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* ── Add modifier inline ── */
.md-add-mod {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
}

.md-add-mod__name {
  flex: 1;
}

.md-add-mod__price {
  max-width: 90px;
}

.md-add-mod__btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.1s;
}

.md-add-mod__btn:hover {
  background: #f3f4f6;
}

.md-add-mod__btn--ok {
  color: #16a34a;
}

.md-add-mod__btn--ok:hover {
  background: #f0fdf4;
}

/* ── Add modifier trigger ── */
.md-add-mod-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.1s;
}

.md-add-mod-trigger:hover {
  background: #f3f4f6;
  color: #EA004B;
}
</style>
