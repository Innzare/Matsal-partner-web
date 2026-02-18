<script lang="ts" setup>
import { useMenuStore } from "@/stores/menu";
import type { MenuItem } from "@/types";

const menuStore = useMenuStore();

const itemDialog = ref(false);
const categoriesDialog = ref(false);
const modifiersDialog = ref(false);
const deleteDialog = ref(false);

const editingItem = ref<MenuItem | null>(null);
const deleteItemId = ref<number | null>(null);
const selectedIds = ref<number[]>([]);
const viewMode = ref<"grid" | "list">("grid");

onMounted(() => {
  menuStore.loadMenu();
});

// Item actions
function openCreateDialog() {
  editingItem.value = null;
  itemDialog.value = true;
}

function openEditDialog(item: MenuItem) {
  editingItem.value = item;
  itemDialog.value = true;
}

function openDeleteDialog(id: number) {
  deleteItemId.value = id;
  deleteDialog.value = true;
}

function confirmDelete() {
  if (deleteItemId.value) {
    menuStore.deleteItem(deleteItemId.value);
    deleteItemId.value = null;
  }
}

function handleSave(data: Omit<MenuItem, "id" | "sortOrder">) {
  if (editingItem.value) {
    menuStore.updateItem(editingItem.value.id, data);
  } else {
    menuStore.addItem(data);
  }
}

// Selection
function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function bulkDisable() {
  menuStore.bulkToggleAvailability(selectedIds.value, false);
  selectedIds.value = [];
}

function bulkEnable() {
  menuStore.bulkToggleAvailability(selectedIds.value, true);
  selectedIds.value = [];
}

function bulkDelete() {
  menuStore.bulkDelete(selectedIds.value);
  selectedIds.value = [];
}

// Categories
const categoryTabs = computed(() => {
  return [{ id: null, name: "Все" }, ...menuStore.sortedCategories];
});

// Stats
const totalItems = computed(() => menuStore.items.length);
const availableItems = computed(
  () => menuStore.items.filter((i) => i.available).length,
);
const stoppedItems = computed(
  () => menuStore.items.filter((i) => !i.available).length,
);
</script>

<template>
  <div class="menu-page">
    <!-- Loading -->
    <div v-if="menuStore.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="menu-header">
        <div>
          <h1 class="menu-header__title">Меню</h1>
          <p class="menu-header__sub">
            {{ totalItems }} позиций · {{ availableItems }} доступно ·
            {{ stoppedItems }} в стопе
          </p>
        </div>
        <div class="d-flex align-stretch ga-2">
          <v-btn
            color="#fff"
            rounded="lg"
            prepend-icon="mdi-shape-outline"
            @click="categoriesDialog = true"
          >
            Категории
          </v-btn>
          <v-btn
            color="#fff"
            rounded="lg"
            prepend-icon="mdi-tune-variant"
            @click="modifiersDialog = true"
          >
            Модификаторы
          </v-btn>
          <v-btn
            color="primary"
            rounded="lg"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Добавить позицию
          </v-btn>
        </div>
      </div>

      <!-- Toolbar row -->
      <div class="menu-toolbar">
        <v-text-field
          v-model="menuStore.searchQuery"
          placeholder="Поиск по названию..."
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          rounded="lg"
          hide-details
          class="menu-search"
          bg-color="white"
        />

        <v-spacer />

        <v-btn-toggle
          v-model="viewMode"
          mandatory
          density="compact"
          rounded="lg"
          variant="outlined"
        >
          <v-btn
            value="grid"
            icon="mdi-view-grid-outline"
            size="small"
            class="px-8"
          />
          <v-btn
            value="list"
            icon="mdi-format-list-bulleted"
            size="small"
            class="px-8"
          />
        </v-btn-toggle>
      </div>

      <!-- Category chips -->
      <div class="menu-categories">
        <div
          v-for="cat in categoryTabs"
          :key="cat.id ?? 'all'"
          class="menu-cat-chip"
          :class="{
            'menu-cat-chip--active': menuStore.selectedCategory === cat.id,
          }"
          @click="menuStore.selectedCategory = cat.id"
        >
          {{ cat.name }}
          <span v-if="cat.id !== null" class="menu-cat-chip__count">
            {{ menuStore.items.filter((i) => i.category === cat.id).length }}
          </span>
        </div>
      </div>

      <!-- Bulk actions bar -->
      <v-slide-y-transition>
        <div v-if="selectedIds.length > 0" class="menu-bulk">
          <v-icon icon="mdi-checkbox-marked" size="18" color="primary" />
          <span class="menu-bulk__count"
            >Выбрано: {{ selectedIds.length }}</span
          >
          <v-spacer />
          <v-btn
            size="small"
            variant="tonal"
            color="green"
            rounded="lg"
            @click="bulkEnable"
            >Включить</v-btn
          >
          <v-btn
            size="small"
            variant="tonal"
            color="orange"
            rounded="lg"
            @click="bulkDisable"
            >В стоп</v-btn
          >
          <v-btn
            size="small"
            variant="tonal"
            color="red"
            rounded="lg"
            @click="bulkDelete"
            >Удалить</v-btn
          >
          <v-btn
            size="small"
            variant="text"
            color="grey"
            @click="selectedIds = []"
            >Снять</v-btn
          >
        </div>
      </v-slide-y-transition>

      <!-- Empty state -->
      <div v-if="menuStore.filteredItems.length === 0" class="menu-empty">
        <v-icon icon="mdi-food-off" size="48" color="grey-lighten-1" />
        <p class="text-body-1 text-grey mt-3">Нет позиций</p>
        <p class="text-caption text-grey-lighten-1">
          Добавьте первую позицию или измените фильтр
        </p>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="menu-grid">
        <MenuItemCard
          v-for="item in menuStore.filteredItems"
          :key="item.id"
          :item="item"
          :selected="selectedIds.includes(item.id)"
          @edit="openEditDialog"
          @delete="openDeleteDialog"
          @toggle-availability="menuStore.toggleAvailability"
          @select="toggleSelect"
        />
      </div>

      <!-- List View -->
      <v-card v-else flat rounded="xl">
        <v-data-table
          :items="menuStore.filteredItems"
          :headers="[
            { key: 'image', title: '', width: '56px', sortable: false },
            { key: 'name', title: 'Название' },
            { key: 'price', title: 'Цена', align: 'end' as const },
            { key: 'weight', title: 'Вес', align: 'end' as const },
            { key: 'available', title: 'Статус', width: '100px' },
            { key: 'actions', title: '', sortable: false, width: '100px' },
          ]"
          hover
          density="comfortable"
        >
          <template v-slot:item.image="{ item }">
            <v-avatar size="40" rounded="lg" class="my-1">
              <v-img v-if="item.image" :src="item.image" cover />
              <v-icon v-else icon="mdi-food" size="20" color="grey" />
            </v-avatar>
          </template>

          <template v-slot:item.name="{ item }">
            <div>
              <p class="font-weight-medium text-body-2">{{ item.name }}</p>
              <p
                class="text-caption text-grey"
                style="
                  max-width: 300px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
              >
                {{ item.description }}
              </p>
            </div>
          </template>

          <template v-slot:item.price="{ item }">
            <span class="font-weight-bold text-body-2">{{ item.price }} ₽</span>
          </template>

          <template v-slot:item.weight="{ item }">
            <span class="text-body-2 text-grey">{{ item.weight }} г</span>
          </template>

          <template v-slot:item.available="{ item }">
            <v-chip
              :color="item.available ? 'green' : 'red'"
              size="x-small"
              variant="tonal"
              @click="menuStore.toggleAvailability(item.id)"
              style="cursor: pointer"
            >
              {{ item.available ? "Активно" : "Стоп" }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-pencil-outline"
              size="x-small"
              variant="text"
              color="grey"
              @click="openEditDialog(item)"
            />
            <v-btn
              icon="mdi-delete-outline"
              size="x-small"
              variant="text"
              color="red"
              @click="openDeleteDialog(item.id)"
            />
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- Dialogs -->
    <MenuItemDialog
      v-model="itemDialog"
      :item="editingItem"
      :categories="menuStore.categories"
      :modifier-groups="menuStore.modifierGroups"
      @save="handleSave"
    />

    <CategoriesDialog
      v-model="categoriesDialog"
      :categories="menuStore.categories"
      @add="menuStore.addCategory"
      @update="menuStore.updateCategory"
      @delete="menuStore.deleteCategory"
      @reorder="menuStore.reorderCategories"
    />

    <ModifiersDialog
      v-model="modifiersDialog"
      :modifier-groups="menuStore.modifierGroups"
      @add="menuStore.addModifierGroup"
      @update="menuStore.updateModifierGroup"
      @delete="menuStore.deleteModifierGroup"
    />

    <ConfirmDialog
      v-model="deleteDialog"
      title="Удалить позицию?"
      text="Позиция будет удалена из меню."
      confirm-text="Удалить"
      confirm-color="red"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.menu-page {
  padding: 0 32px 32px;
}

/* ── Header ── */
.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.menu-header__title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.menu-header__sub {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ── Toolbar ── */
.menu-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.menu-search {
  max-width: 320px;
}

/* ── Category chips ── */
.menu-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.menu-cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.menu-cat-chip:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.menu-cat-chip--active {
  background: #ea004b;
  border-color: #ea004b;
  color: #fff;
}

.menu-cat-chip__count {
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.08);
}

.menu-cat-chip--active .menu-cat-chip__count {
  background: rgba(255, 255, 255, 0.25);
}

/* ── Bulk bar ── */
.menu-bulk {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #eff6ff;
  border-radius: 12px;
  margin-bottom: 16px;
}

.menu-bulk__count {
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
}

/* ── Empty ── */
.menu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 0;
}

/* ── Grid ── */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
</style>
