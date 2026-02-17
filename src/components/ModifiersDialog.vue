<script lang="ts" setup>
import type { ModifierGroup, Modifier } from '@/types'

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

const expandedGroups = ref<number[]>([])
const showAddForm = ref(false)
const deleteConfirmId = ref<number | null>(null)

// New group form
const newGroup = ref({
  name: '',
  required: false,
  maxSelect: 1,
})

// New modifier within a group
const newModifierGroupId = ref<number | null>(null)
const newModifier = ref({ name: '', price: 0 })

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
  const idx = expandedGroups.value.indexOf(id)
  if (idx >= 0) {
    expandedGroups.value.splice(idx, 1)
  } else {
    expandedGroups.value.push(id)
  }
}

function updateGroupField(group: ModifierGroup, field: string, value: any) {
  emit('update', group.id, { [field]: value })
}

function addModifierToGroup(groupId: number) {
  if (!newModifier.value.name.trim()) return
  const group = props.modifierGroups.find(g => g.id === groupId)
  if (!group) return

  const maxId = group.modifiers.reduce((max, m) => Math.max(max, m.id), 0)
  const updatedModifiers = [
    ...group.modifiers,
    { id: maxId + 1, name: newModifier.value.name.trim(), price: newModifier.value.price },
  ]
  emit('update', groupId, { modifiers: updatedModifiers })
  newModifier.value = { name: '', price: 0 }
  newModifierGroupId.value = null
}

function removeModifier(group: ModifierGroup, modifierId: number) {
  const updatedModifiers = group.modifiers.filter(m => m.id !== modifierId)
  emit('update', group.id, { modifiers: updatedModifiers })
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
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pt-5 px-6">
        <span class="text-h6">Группы модификаторов</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="px-6">
        <!-- Add group form -->
        <v-btn
          v-if="!showAddForm"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus"
          block
          class="mb-4"
          @click="showAddForm = true"
        >
          Добавить группу
        </v-btn>

        <v-card v-if="showAddForm" variant="outlined" rounded="lg" class="pa-4 mb-4">
          <v-text-field
            v-model="newGroup.name"
            label="Название группы"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-3"
          />
          <div class="d-flex ga-3 align-center mb-3">
            <v-switch v-model="newGroup.required" label="Обязательная" density="compact" hide-details color="primary" />
            <v-text-field
              v-model.number="newGroup.maxSelect"
              label="Макс. выбор"
              variant="outlined"
              density="compact"
              type="number"
              hide-details
              style="max-width: 120px"
            />
          </div>
          <div class="d-flex ga-2">
            <v-btn variant="text" size="small" @click="showAddForm = false">Отмена</v-btn>
            <v-btn color="primary" variant="flat" size="small" :disabled="!newGroup.name.trim()" @click="addGroup">Создать</v-btn>
          </div>
        </v-card>

        <!-- Groups list -->
        <v-card
          v-for="group in modifierGroups"
          :key="group.id"
          variant="outlined"
          rounded="lg"
          class="mb-3"
        >
          <div
            class="d-flex align-center justify-space-between pa-4 cursor-pointer"
            @click="toggleExpand(group.id)"
          >
            <div>
              <span class="font-weight-bold text-body-2">{{ group.name }}</span>
              <v-chip v-if="group.required" size="x-small" color="orange" class="ml-2">Обязательная</v-chip>
              <span class="text-caption text-grey ml-2">{{ group.modifiers.length }} вариантов</span>
            </div>
            <div class="d-flex ga-0">
              <v-btn icon="mdi-delete" size="x-small" variant="text" color="red" @click.stop="confirmDelete(group.id)" />
              <v-icon :icon="expandedGroups.includes(group.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
            </div>
          </div>

          <v-expand-transition>
            <div v-if="expandedGroups.includes(group.id)" class="px-4 pb-4">
              <v-divider class="mb-3" />

              <div class="d-flex ga-3 mb-3">
                <v-switch
                  :model-value="group.required"
                  label="Обязательная"
                  density="compact"
                  hide-details
                  color="primary"
                  @update:model-value="updateGroupField(group, 'required', $event)"
                />
                <v-text-field
                  :model-value="group.maxSelect"
                  label="Макс. выбор"
                  variant="outlined"
                  density="compact"
                  type="number"
                  hide-details
                  style="max-width: 120px"
                  @update:model-value="updateGroupField(group, 'maxSelect', Number($event))"
                />
              </div>

              <!-- Modifiers -->
              <div
                v-for="mod in group.modifiers"
                :key="mod.id"
                class="d-flex align-center justify-space-between py-1"
              >
                <span class="text-body-2">{{ mod.name }}</span>
                <div class="d-flex align-center ga-2">
                  <span class="text-body-2 text-grey">{{ mod.price ? '+' + mod.price + ' ₽' : 'бесплатно' }}</span>
                  <v-btn icon="mdi-close" size="x-small" variant="text" @click="removeModifier(group, mod.id)" />
                </div>
              </div>

              <!-- Add modifier -->
              <div v-if="newModifierGroupId === group.id" class="d-flex ga-2 mt-2">
                <v-text-field
                  v-model="newModifier.name"
                  label="Название"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
                <v-text-field
                  v-model.number="newModifier.price"
                  label="Цена"
                  variant="outlined"
                  density="compact"
                  type="number"
                  hide-details
                  style="max-width: 100px"
                />
                <v-btn icon="mdi-check" size="small" color="green" variant="text" @click="addModifierToGroup(group.id)" />
                <v-btn icon="mdi-close" size="small" variant="text" @click="newModifierGroupId = null" />
              </div>
              <v-btn
                v-else
                variant="text"
                size="small"
                prepend-icon="mdi-plus"
                class="mt-2"
                @click="newModifierGroupId = group.id; newModifier = { name: '', price: 0 }"
              >
                Добавить вариант
              </v-btn>
            </div>
          </v-expand-transition>
        </v-card>

        <p v-if="modifierGroups.length === 0" class="text-caption text-grey text-center py-4">
          Нет групп модификаторов
        </p>
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
