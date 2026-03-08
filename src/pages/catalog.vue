<script lang="ts" setup>
import { useCatalogStore } from "@/stores/catalog";
import type { GroceryProduct } from "@/types";

const catalogStore = useCatalogStore();

const itemDialog = ref(false);
const categoriesDialog = ref(false);
const deleteDialog = ref(false);

const editingItem = ref<GroceryProduct | null>(null);
const deleteItemId = ref<string | null>(null);
const selectedIds = ref<string[]>([]);
const viewMode = ref<"grid" | "list">("grid");

onMounted(() => {
  catalogStore.loadCatalog();
});

// Item actions
function openCreateDialog() {
  editingItem.value = null;
  itemDialog.value = true;
}

function openEditDialog(item: GroceryProduct) {
  editingItem.value = item;
  itemDialog.value = true;
}

function openDeleteDialog(id: string) {
  deleteItemId.value = id;
  deleteDialog.value = true;
}

function confirmDelete() {
  if (deleteItemId.value) {
    catalogStore.deleteProduct(deleteItemId.value);
    deleteItemId.value = null;
  }
}

async function handleSave(data: Omit<GroceryProduct, "id" | "sortOrder">, pendingImage?: File) {
  if (editingItem.value) {
    await catalogStore.updateProduct(editingItem.value.id, data);
  } else {
    const created = await catalogStore.addProduct(data);
    if (pendingImage && created) {
      await catalogStore.uploadProductImage(created.id, pendingImage);
    }
  }
}

// Selection
function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function bulkDisable() {
  catalogStore.bulkToggleAvailability(selectedIds.value, false);
  selectedIds.value = [];
}

function bulkEnable() {
  catalogStore.bulkToggleAvailability(selectedIds.value, true);
  selectedIds.value = [];
}

function bulkDelete() {
  catalogStore.bulkDelete(selectedIds.value);
  selectedIds.value = [];
}

// Categories
const categoryTabs = computed(() => {
  return [{ id: null, name: "Все" }, ...catalogStore.sortedCategories];
});

// Table headers
const tableHeaders = [
  { key: 'name', title: 'Товар' },
  { key: 'category', title: 'Категория', width: '140px' },
  { key: 'price', title: 'Цена', align: 'end' as const, width: '110px' },
  { key: 'unit', title: 'Ед. изм.', width: '100px' },
  { key: 'available', title: 'Статус', width: '120px' },
  { key: 'actions', title: '', sortable: false, width: '90px' },
];

// Helpers
function getCategoryName(catId: string): string {
  return catalogStore.categories.find((c) => c.id === catId)?.name ?? "—";
}

function getUnitLabel(item: GroceryProduct): string {
  if (item.unitValue === 1) return item.unit;
  return `${item.unitValue} ${item.unit}`;
}

// Stats
const totalItems = computed(() => catalogStore.products.length);
const availableItems = computed(
  () => catalogStore.products.filter((i) => i.available).length,
);
const stoppedItems = computed(
  () => catalogStore.products.filter((i) => !i.available).length,
);

// Sections grouped by category
const sections = computed(() => {
  const items = catalogStore.filteredProducts;
  const grouped = new Map<string, typeof items>();

  for (const item of items) {
    const list = grouped.get(item.categoryId) || [];
    list.push(item);
    grouped.set(item.categoryId, list);
  }

  return catalogStore.sortedCategories
    .filter((c) => grouped.has(c.id))
    .map((cat) => ({
      id: cat.id,
      title: cat.name,
      items: grouped.get(cat.id)!,
    }));
});
</script>

<template>
  <div class="cat-page">
    <!-- Loading -->
    <div v-if="catalogStore.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="cat-header">
        <div>
          <p class="cat-header__sub">
            {{ totalItems }} товаров · {{ availableItems }} доступно ·
            {{ stoppedItems }} в стопе
          </p>
        </div>
        <div class="d-flex align-stretch ga-2">
          <v-btn
            color="#fff"
            rounded="lg"
            prepend-icon="mdi-shape-outline"
            class="cat-btn-sec"
            @click="categoriesDialog = true"
          >
            Категории
          </v-btn>
          <v-btn
            color="primary"
            rounded="lg"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Добавить товар
          </v-btn>
        </div>
      </div>

      <!-- Toolbar row -->
      <div class="cat-toolbar">
        <v-text-field
          v-model="catalogStore.searchQuery"
          placeholder="Поиск по названию..."
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          rounded="lg"
          hide-details
          class="cat-search"
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
      <div class="cat-categories">
        <div
          v-for="cat in categoryTabs"
          :key="cat.id ?? 'all'"
          class="cat-cat-chip"
          :class="{
            'cat-cat-chip--active': catalogStore.selectedCategory === cat.id,
          }"
          @click="catalogStore.selectedCategory = cat.id"
        >
          {{ cat.name }}
          <span v-if="cat.id !== null" class="cat-cat-chip__count">
            {{ catalogStore.products.filter((i) => i.categoryId === cat.id).length }}
          </span>
        </div>
      </div>

      <!-- Bulk actions bar -->
      <v-slide-y-transition>
        <div v-if="selectedIds.length > 0" class="cat-bulk">
          <v-icon icon="mdi-checkbox-marked" size="18" color="primary" />
          <span class="cat-bulk__count">Выбрано: {{ selectedIds.length }}</span>
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
      <div v-if="catalogStore.filteredProducts.length === 0" class="cat-empty">
        <v-icon icon="mdi-package-variant-closed-remove" size="48" color="grey-lighten-1" />
        <p class="text-body-1 text-grey mt-3">Нет товаров</p>
        <p class="text-caption text-grey-lighten-1">
          Добавьте первый товар или измените фильтр
        </p>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="cat-sections">
        <div v-for="section in sections" :key="section.id" class="cat-section">
          <div v-if="!catalogStore.selectedCategory" class="cat-section__header">
            <span class="cat-section__title">{{ section.title }}</span>
            <span class="cat-section__count">{{ section.items.length }}</span>
          </div>
          <div class="cat-grid">
            <ProductCard
              v-for="item in section.items"
              :key="item.id"
              :item="item"
              :selected="selectedIds.includes(item.id)"
              @edit="openEditDialog"
              @delete="openDeleteDialog"
              @toggle-availability="catalogStore.toggleAvailability"
              @select="toggleSelect"
            />
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="cat-sections">
        <div v-for="section in sections" :key="section.id" class="cat-section">
          <div v-if="!catalogStore.selectedCategory" class="cat-section__header">
            <span class="cat-section__title">{{ section.title }}</span>
            <span class="cat-section__count">{{ section.items.length }}</span>
          </div>
          <v-card flat rounded="xl" class="ct-table-card">
            <v-data-table
              :items="section.items"
              :headers="tableHeaders"
              :items-per-page="-1"
              hover
              class="ct-table"
            >
              <template #bottom />

              <template #item.name="{ item }">
                <div class="d-flex align-center ga-3">
                  <div class="ct-img">
                    <v-img
                      v-if="item.image"
                      :src="item.image"
                      cover
                      class="ct-img__inner"
                    />
                    <v-icon
                      v-else
                      icon="mdi-package-variant"
                      size="18"
                      color="grey-lighten-1"
                    />
                  </div>
                  <div class="ct-info">
                    <p class="ct-info__name">{{ item.name }}</p>
                    <p class="ct-info__desc">{{ item.description }}</p>
                  </div>
                </div>
              </template>

              <template #item.category="{ item }">
                <span class="ct-category">{{
                  getCategoryName(item.categoryId)
                }}</span>
              </template>

              <template #item.price="{ item }">
                <span class="ct-price"
                  >{{ item.price.toLocaleString("ru-RU") }} ₽</span
                >
              </template>

              <template #item.unit="{ item }">
                <span class="ct-unit">{{ getUnitLabel(item) }}</span>
              </template>

              <template #item.available="{ item }">
                <div
                  class="ct-status"
                  :class="item.available ? 'ct-status--on' : 'ct-status--off'"
                  @click.stop="catalogStore.toggleAvailability(item.id)"
                >
                  <span class="ct-status__dot" />
                  {{ item.available ? "Активно" : "Стоп" }}
                </div>
              </template>

              <template #item.actions="{ item }">
                <div class="ct-actions">
                  <button class="ct-action" @click.stop="openEditDialog(item)">
                    <v-icon icon="mdi-pencil-outline" size="15" />
                  </button>
                  <button
                    class="ct-action ct-action--danger"
                    @click.stop="openDeleteDialog(item.id)"
                  >
                    <v-icon icon="mdi-delete-outline" size="15" />
                  </button>
                </div>
              </template>
            </v-data-table>
          </v-card>
        </div>
      </div>
    </template>

    <!-- Dialogs -->
    <ProductDialog
      v-model="itemDialog"
      :item="editingItem"
      :categories="catalogStore.categories"
      @save="handleSave"
    />

    <GroceryCategoriesDialog
      v-model="categoriesDialog"
      :categories="catalogStore.categories"
      @add="catalogStore.addCategory"
      @update="catalogStore.updateCategory"
      @delete="catalogStore.deleteCategory"
      @reorder="catalogStore.reorderCategories"
    />

    <ConfirmDialog
      v-model="deleteDialog"
      title="Удалить товар?"
      text="Товар будет удалён из каталога."
      confirm-text="Удалить"
      confirm-color="red"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.cat-page {
  padding: 0 32px 32px;
}

/* Header */
.cat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-top: 20px;
}

.cat-header__sub {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

/* Toolbar */
.cat-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.cat-search {
  max-width: 320px;
}

/* Category chips */
.cat-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.cat-cat-chip {
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

.cat-cat-chip:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.cat-cat-chip--active {
  background: #16a34a;
  border-color: #16a34a;
  color: #fff;
}

.cat-cat-chip__count {
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.08);
}

.cat-cat-chip--active .cat-cat-chip__count {
  background: rgba(255, 255, 255, 0.25);
}

/* Bulk bar */
.cat-bulk {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #eff6ff;
  border-radius: 12px;
  margin-bottom: 16px;
}

.cat-bulk__count {
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
}

/* Empty */
.cat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 0;
}

/* Sections */
.cat-sections {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.cat-section__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.cat-section__title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.cat-section__count {
  font-size: 12px;
  font-weight: 600;
  min-width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  border-radius: 11px;
  color: #6b7280;
  background: #f3f4f6;
}

/* Grid */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/* List table */
.ct-table-card {
  overflow: hidden;
}

.ct-table :deep(th) {
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #9ca3af !important;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
}

.ct-table :deep(td) {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  border-bottom: 1px solid #f5f5f5 !important;
}

.ct-table :deep(tr:hover td) {
  background: #fafafa !important;
}

/* Image */
.ct-img {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #f3f4f6;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ct-img__inner {
  width: 100%;
  height: 100%;
}

/* Info */
.ct-info {
  min-width: 0;
}

.ct-info__name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ct-info__desc {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Category */
.ct-category {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  padding: 3px 10px;
  border-radius: 6px;
  background: #f3f4f6;
}

/* Price */
.ct-price {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
}

/* Unit */
.ct-unit {
  font-size: 13px;
  color: #9ca3af;
}

/* Status */
.ct-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.1s;
  white-space: nowrap;
}

.ct-status:hover {
  opacity: 0.8;
}

.ct-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ct-status--on {
  color: #16a34a;
  background: #e8f5e9;
}

.ct-status--on .ct-status__dot {
  background: #16a34a;
}

.ct-status--off {
  color: #dc2626;
  background: #fef2f2;
}

.ct-status--off .ct-status__dot {
  background: #dc2626;
}

/* Actions */
.ct-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.1s;
}

.ct-table :deep(tr:hover) .ct-actions {
  opacity: 1;
}

.ct-action {
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

.ct-action:hover {
  background: #f3f4f6;
  color: #374151;
}

.ct-action--danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* Dark Theme */
.dark .cat-btn-sec {
  background-color: #252538 !important;
  color: #e4e4e7 !important;
}

.dark .cat-cat-chip {
  color: #a1a1aa;
  background: #1e1e2e;
  border-color: #2e2e42;
}

.dark .cat-cat-chip:hover {
  background: #252538;
  border-color: #3f3f5a;
}

.dark .cat-cat-chip__count {
  background: rgba(255, 255, 255, 0.08);
}

.dark .cat-bulk {
  background: rgba(25, 118, 210, 0.12);
}

.dark .cat-bulk__count {
  color: #60a5fa;
}

.dark .cat-search :deep(.v-field) {
  background: #252538 !important;
}

.dark .cat-section__title {
  color: #e4e4e7;
}

.dark .cat-section__count {
  color: #a1a1aa;
  background: #252538;
}

.dark .ct-table :deep(td) {
  border-bottom-color: #2e2e42 !important;
}

.dark .ct-table :deep(tr:hover td) {
  background: #252538 !important;
}

.dark .ct-img {
  background: #252538;
}

.dark .ct-info__name {
  color: #e4e4e7;
}

.dark .ct-category {
  color: #a1a1aa;
  background: #252538;
}

.dark .ct-price {
  color: #e4e4e7;
}

.dark .ct-status--on {
  color: #4ade80;
  background: rgba(22, 163, 74, 0.15);
}

.dark .ct-status--off {
  color: #f87171;
  background: rgba(220, 38, 38, 0.15);
}

.dark .ct-action:hover {
  background: #252538;
  color: #e4e4e7;
}

.dark .ct-action--danger:hover {
  background: rgba(220, 38, 38, 0.15);
  color: #f87171;
}

/* Responsive */
@media (max-width: 767px) {
  .cat-page {
    padding: 0 16px 24px;
  }

  .cat-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .cat-toolbar {
    flex-wrap: wrap;
  }

  .cat-search {
    max-width: 100%;
    flex: 1;
    min-width: 0;
  }

  .cat-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>
