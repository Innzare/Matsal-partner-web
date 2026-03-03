<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'

const restaurantStore = useRestaurantStore()
const emit = defineEmits<{ save: [text: string] }>()

const cuisineOptions = [
  'Грузинская', 'Кавказская', 'Европейская', 'Итальянская',
  'Японская', 'Китайская', 'Фастфуд', 'Домашняя кухня',
  'Выпечка', 'Десерты', 'Здоровая еда', 'Халяль',
]

const form = ref({
  name: '',
  description: '',
  address: '',
  phone: '',
  cuisineTypes: [] as string[],
})

const logoUploading = ref(false)
const coverUploading = ref(false)
const logoDeleting = ref(false)
const coverDeleting = ref(false)
const logoInputRef = ref<HTMLInputElement>()
const coverInputRef = ref<HTMLInputElement>()

watch(() => restaurantStore.restaurant, (r) => {
  if (!r) return
  form.value = {
    name: r.name,
    description: r.description ?? '',
    address: r.address,
    phone: r.phone ?? '',
    cuisineTypes: [...r.cuisineTypes],
  }
}, { immediate: true })

async function handleUpload(file: File, type: 'logo' | 'cover') {
  const loading = type === 'logo' ? logoUploading : coverUploading
  loading.value = true
  try {
    await restaurantStore.uploadImage(file, type)
    emit('save', type === 'logo' ? 'Логотип обновлён' : 'Обложка обновлена')
  } catch (e: any) {
    emit('save', e.message || 'Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

function onLogoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleUpload(file, 'logo')
  input.value = ''
}

function onCoverChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleUpload(file, 'cover')
  input.value = ''
}

async function handleDelete(type: 'logo' | 'cover') {
  const loading = type === 'logo' ? logoDeleting : coverDeleting
  loading.value = true
  try {
    await restaurantStore.deleteImage(type)
    emit('save', type === 'logo' ? 'Логотип удалён' : 'Обложка удалена')
  } catch (e: any) {
    emit('save', e.message || 'Ошибка удаления')
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  await restaurantStore.updateRestaurant({
    name: form.value.name,
    description: form.value.description,
    address: form.value.address,
    phone: form.value.phone,
    cuisineTypes: form.value.cuisineTypes,
  })
  emit('save', 'Профиль сохранён')
}
</script>

<template>
  <div class="settings-section">
    <div class="section-title">Информация о заведении</div>
    <div class="section-desc">Основные данные вашего ресторана, видимые клиентам</div>

    <!-- Logo & Cover upload -->
    <v-card flat rounded="xl" class="mb-5 overflow-hidden">
      <!-- Cover image -->
      <div class="cover-area" @click="coverInputRef?.click()">
        <v-img
          v-if="restaurantStore.restaurant?.imageUrl"
          :src="restaurantStore.restaurant.imageUrl"
          height="180" cover
        />
        <div v-else class="cover-placeholder" />

        <div class="cover-overlay">
          <v-progress-circular v-if="coverUploading || coverDeleting" indeterminate size="32" color="white" />
          <template v-else>
            <v-icon icon="mdi-camera" size="24" color="white" />
            <span class="text-white text-caption">Изменить обложку</span>
          </template>
        </div>

        <!-- Delete cover button -->
        <v-btn
          v-if="restaurantStore.restaurant?.imageUrl && !coverUploading && !coverDeleting"
          class="cover-delete-btn"
          icon="mdi-close" size="x-small" color="error" variant="flat"
          @click.stop="handleDelete('cover')"
        />

        <input
          ref="coverInputRef"
          type="file" accept="image/jpeg,image/png,image/webp"
          hidden @change="onCoverChange"
        />
      </div>

      <!-- Logo -->
      <div class="logo-wrapper">
        <div class="logo-area" @click="logoInputRef?.click()">
          <v-avatar size="88" color="grey-lighten-3">
            <v-img v-if="restaurantStore.restaurant?.logo" :src="restaurantStore.restaurant.logo" />
            <v-icon v-else icon="mdi-store" size="36" color="grey" />
          </v-avatar>

          <div class="logo-overlay">
            <v-progress-circular v-if="logoUploading || logoDeleting" indeterminate size="20" width="2" color="white" />
            <v-icon v-else icon="mdi-camera" size="18" color="white" />
          </div>

          <!-- Delete logo button -->
          <v-btn
            v-if="restaurantStore.restaurant?.logo && !logoUploading && !logoDeleting"
            class="logo-delete-btn"
            icon="mdi-close" size="x-small" color="error" variant="flat"
            @click.stop="handleDelete('logo')"
          />

          <input
            ref="logoInputRef"
            type="file" accept="image/jpeg,image/png,image/webp"
            hidden @change="onLogoChange"
          />
        </div>
      </div>
    </v-card>

    <!-- Fields -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <v-text-field
        v-model="form.name" label="Название заведения"
        variant="outlined" density="comfortable" class="mb-4" hide-details
      />
      <v-textarea
        v-model="form.description" label="Описание"
        variant="outlined" density="comfortable" rows="3" class="mb-4"
        counter="500"
        :rules="[(v: string) => v.length <= 500 || 'Максимум 500 символов']"
      />
      <div class="d-flex ga-4 mb-4">
        <v-text-field
          v-model="form.address" label="Адрес"
          variant="outlined" density="comfortable"
          prepend-inner-icon="mdi-map-marker-outline" hide-details style="flex: 1"
        />
        <v-text-field
          v-model="form.phone" label="Телефон"
          variant="outlined" density="comfortable"
          prepend-inner-icon="mdi-phone-outline" hide-details
          placeholder="+7 (___) ___-__-__" style="flex: 1"
        />
      </div>
      <v-combobox
        v-model="form.cuisineTypes" :items="cuisineOptions"
        label="Тип кухни" variant="outlined" density="comfortable"
        multiple chips closable-chips hide-details
      />

      <!-- Stats row -->
      <v-divider class="my-5" />
      <div class="d-flex ga-6 align-center">
        <div class="settings-stat">
          <v-icon icon="mdi-star" color="amber" size="18" class="mr-1" />
          <span class="settings-stat__value">{{ restaurantStore.restaurant?.rating }}</span>
          <span class="settings-stat__label">рейтинг</span>
        </div>
        <div class="settings-stat">
          <v-icon icon="mdi-comment-text-outline" color="primary" size="18" class="mr-1" />
          <span class="settings-stat__value">{{ restaurantStore.restaurant?.reviewsCount }}</span>
          <span class="settings-stat__label">отзывов</span>
        </div>
        <v-spacer />
        <v-btn
          color="primary" variant="flat" rounded="lg"
          :loading="restaurantStore.isSaving" @click="saveProfile"
        >
          Сохранить профиль
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
/* ── Cover ── */
.cover-area {
  position: relative; cursor: pointer; height: 180px;
  background: #f3f4f6;
}
.cover-placeholder {
  height: 100%; background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
}
.cover-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; background: rgba(0,0,0,0.3); opacity: 0;
  transition: opacity 0.2s;
}
.cover-area:hover .cover-overlay { opacity: 1; }

/* ── Logo ── */
.logo-wrapper {
  display: flex; padding: 0 24px;
  margin-top: -44px; position: relative; z-index: 1;
  margin-bottom: 16px;
}
.logo-area {
  position: relative; cursor: pointer;
  border-radius: 50%;
}
.logo-area .v-avatar {
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.logo-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba(0,0,0,0.4);
  opacity: 0; transition: opacity 0.2s;
}
.logo-area:hover .logo-overlay { opacity: 1; }

/* ── Delete buttons ── */
.cover-delete-btn {
  position: absolute; top: 8px; right: 8px; z-index: 2;
  opacity: 0; transition: opacity 0.2s;
}
.cover-area:hover .cover-delete-btn { opacity: 1; }

.logo-delete-btn {
  position: absolute; top: -4px; right: -4px; z-index: 2;
  opacity: 0; transition: opacity 0.2s;
}
.logo-area:hover .logo-delete-btn { opacity: 1; }

/* ── Stats ── */
.settings-stat { display: flex; align-items: center; gap: 4px; }
.settings-stat__value { font-weight: 700; font-size: 16px; color: #1a1a2e; }
.settings-stat__label { font-size: 13px; color: #9ca3af; }

/* ── Dark ── */
.dark .settings-stat__value { color: #e4e4e7; }
.dark .settings-stat__label { color: #71717a; }
.dark .cover-area { background: #1e1e2e; }
.dark .cover-placeholder { background: linear-gradient(135deg, #1e1e2e, #252538); }
.dark .logo-area .v-avatar { border-color: #1e1e2e; }

/* ── Responsive ── */
@media (max-width: 767px) {
  .cover-area { height: 140px; }
  .logo-wrapper { margin-top: -36px; padding: 0 16px; }
}
</style>
