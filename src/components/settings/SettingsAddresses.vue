<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import { useEstablishment } from '@/composables/useEstablishment'
import type { EstablishmentAddress } from '@/types'

declare const ymaps: any

const est = useEstablishment()
const emit = defineEmits<{ save: [text: string] }>()

const addresses = ref<EstablishmentAddress[]>([])
const loading = ref(true)
const deleting = ref<string | null>(null)

// Dialog state
const dialog = ref(false)
const dialogSaving = ref(false)
const editingId = ref<string | null>(null)
const selectedAddress = ref('')
const selectedLat = ref(43.3169) // Грозный
const selectedLon = ref(45.6981)

// Search
const searchQuery = ref('')
const suggestions = ref<any[]>([])
const searchLoading = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Map
let mapInstance: any = null
let placemark: any = null
const mapContainerId = 'address-map-container'

async function loadAddresses() {
  loading.value = true
  try {
    addresses.value = await est.getAddresses()
  } catch (e: any) {
    emit('save', e.message || 'Ошибка загрузки адресов')
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  editingId.value = null
  selectedAddress.value = ''
  selectedLat.value = 43.3169
  selectedLon.value = 45.6981
  searchQuery.value = ''
  suggestions.value = []
  dialog.value = true
  nextTick(() => initMap())
}

function openEditDialog(addr: EstablishmentAddress) {
  editingId.value = addr.id
  selectedAddress.value = addr.address
  selectedLat.value = addr.lat
  selectedLon.value = addr.lon
  searchQuery.value = ''
  suggestions.value = []
  dialog.value = true
  nextTick(() => initMap())
}

function closeDialog() {
  dialog.value = false
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
    placemark = null
  }
}

function initMap() {
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }

  ymaps.ready(() => {
    mapInstance = new ymaps.Map(mapContainerId, {
      center: [selectedLat.value, selectedLon.value],
      zoom: 15,
      controls: ['zoomControl'],
    })

    placemark = new ymaps.Placemark(
      [selectedLat.value, selectedLon.value],
      {},
      { preset: 'islands#redDotIcon', draggable: true },
    )

    placemark.events.add('dragend', () => {
      const coords = placemark.geometry.getCoordinates()
      selectedLat.value = coords[0]
      selectedLon.value = coords[1]
      reverseGeocode(coords[0], coords[1])
    })

    mapInstance.geoObjects.add(placemark)

    mapInstance.events.add('click', (e: any) => {
      const coords = e.get('coords')
      selectedLat.value = coords[0]
      selectedLon.value = coords[1]
      placemark.geometry.setCoordinates(coords)
      reverseGeocode(coords[0], coords[1])
    })
  })
}

function reverseGeocode(lat: number, lon: number) {
  ymaps.geocode([lat, lon]).then((res: any) => {
    const firstResult = res.geoObjects.get(0)
    if (firstResult) {
      selectedAddress.value = firstResult.getAddressLine()
    }
  })
}

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    suggestions.value = []
    return
  }
  searchTimeout = setTimeout(() => {
    searchLoading.value = true
    ymaps.suggest(searchQuery.value, { boundedBy: [[43.1, 45.4], [43.5, 46.0]] })
      .then((items: any[]) => {
        suggestions.value = items.slice(0, 5)
      })
      .finally(() => { searchLoading.value = false })
  }, 400)
}

function selectSuggestion(item: any) {
  searchQuery.value = ''
  suggestions.value = []
  ymaps.geocode(item.displayName).then((res: any) => {
    const firstResult = res.geoObjects.get(0)
    if (firstResult) {
      const coords = firstResult.geometry.getCoordinates()
      selectedLat.value = coords[0]
      selectedLon.value = coords[1]
      selectedAddress.value = firstResult.getAddressLine()
      if (mapInstance) {
        mapInstance.setCenter(coords, 16)
        placemark.geometry.setCoordinates(coords)
      }
    }
  })
}

async function saveAddress() {
  if (!selectedAddress.value.trim()) return
  dialogSaving.value = true
  try {
    const payload = {
      address: selectedAddress.value,
      lat: selectedLat.value,
      lon: selectedLon.value,
    }
    if (editingId.value) {
      await est.updateAddress(editingId.value, payload)
      emit('save', 'Адрес обновлён')
    } else {
      await est.addAddress(payload)
      emit('save', 'Адрес добавлен')
    }
    closeDialog()
    await loadAddresses()
  } catch (e: any) {
    emit('save', e.message || 'Ошибка сохранения')
  } finally {
    dialogSaving.value = false
  }
}

async function removeAddress(id: string) {
  deleting.value = id
  try {
    await est.deleteAddress(id)
    addresses.value = addresses.value.filter((a) => a.id !== id)
    emit('save', 'Адрес удалён')
  } catch (e: any) {
    emit('save', e.message || 'Ошибка удаления')
  } finally {
    deleting.value = null
  }
}

onMounted(loadAddresses)
</script>

<template>
  <div class="settings-section">
    <div class="section-title">Адреса филиалов</div>
    <div class="section-desc">Добавьте адреса ваших точек — они будут отображаться клиентам на карте</div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Address list -->
    <template v-else>
      <v-card v-if="addresses.length === 0" flat rounded="xl" class="pa-8 text-center mb-4">
        <v-icon icon="mdi-map-marker-off-outline" size="48" color="grey-lighten-1" class="mb-3" />
        <div class="text-body-1 text-grey-darken-1">Нет добавленных адресов</div>
        <div class="text-body-2 text-grey mt-1">Добавьте первый адрес вашего заведения</div>
      </v-card>

      <div v-else class="addresses-grid">
        <v-card
          v-for="addr in addresses" :key="addr.id"
          flat rounded="xl" class="address-card"
        >
          <div class="address-card__body">
            <v-icon icon="mdi-map-marker" size="20" color="primary" class="mt-0.5" />
            <div class="address-card__info">
              <div class="address-card__text">{{ addr.address }}</div>
              <div class="address-card__coords">{{ addr.lat.toFixed(4) }}, {{ addr.lon.toFixed(4) }}</div>
            </div>
          </div>
          <div class="address-card__actions">
            <v-btn
              icon="mdi-pencil-outline" size="small" variant="text" color="grey"
              @click="openEditDialog(addr)"
            />
            <v-btn
              icon="mdi-delete-outline" size="small" variant="text" color="red"
              :loading="deleting === addr.id"
              @click="removeAddress(addr.id)"
            />
          </div>
        </v-card>
      </div>

      <v-btn
        color="primary" variant="flat" rounded="lg" class="mt-4"
        prepend-icon="mdi-plus"
        @click="openAddDialog"
      >
        Добавить адрес
      </v-btn>
    </template>

    <!-- Map dialog -->
    <v-dialog v-model="dialog" max-width="700" persistent @after-leave="closeDialog">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-5 pb-3">
          <span class="text-h6 font-weight-bold">
            {{ editingId ? 'Редактировать адрес' : 'Новый адрес' }}
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
        </v-card-title>

        <v-card-text class="pa-5 pt-0">
          <!-- Search -->
          <v-text-field
            v-model="searchQuery"
            label="Поиск адреса"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            hide-details
            class="mb-3"
            :loading="searchLoading"
            @input="onSearchInput"
          />

          <!-- Suggestions -->
          <v-list v-if="suggestions.length > 0" class="suggestions-list mb-3" density="compact" rounded="lg">
            <v-list-item
              v-for="(item, i) in suggestions" :key="i"
              :title="item.displayName"
              prepend-icon="mdi-map-marker-outline"
              @click="selectSuggestion(item)"
            />
          </v-list>

          <!-- Map -->
          <div :id="mapContainerId" class="map-container" />

          <!-- Selected address -->
          <v-text-field
            v-model="selectedAddress"
            label="Адрес"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-map-marker"
            hide-details
            class="mt-3"
            readonly
          />

          <div class="text-caption text-grey mt-1 ml-1">
            Нажмите на карту или перетащите маркер для выбора точки
          </div>
        </v-card-text>

        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Отмена</v-btn>
          <v-btn
            color="primary" variant="flat" rounded="lg"
            :loading="dialogSaving"
            :disabled="!selectedAddress.trim()"
            @click="saveAddress"
          >
            {{ editingId ? 'Сохранить' : 'Добавить' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.addresses-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.address-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
}

.address-card__body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.address-card__info {
  flex: 1;
  min-width: 0;
}

.address-card__text {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  line-height: 1.4;
}

.address-card__coords {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.address-card__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.map-container {
  width: 100%;
  height: 350px;
  border-radius: 12px;
  overflow: hidden;
}

.suggestions-list {
  border: 1px solid #e5e7eb;
  max-height: 200px;
  overflow-y: auto;
}

/* Dark mode */
.dark .address-card {
  border-color: #2e2e42;
}
.dark .address-card__text {
  color: #e4e4e7;
}
.dark .address-card__coords {
  color: #71717a;
}
.dark .suggestions-list {
  border-color: #2e2e42;
}
</style>
