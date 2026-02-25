<script setup lang="ts">
import { usePushCampaignsStore } from '@/stores/pushCampaigns'
import type { PushAudience, PushScheduleMode } from '@/types'
import { PUSH_AUDIENCE_LABELS, PUSH_STATUS_LABELS, PUSH_STATUS_COLORS } from '@/types'

const store = usePushCampaignsStore()

onMounted(() => store.load())

// ── Dialog ──
const dialog = ref(false)
const form = ref({
  title: '',
  body: '',
  imageUrl: '',
  audience: 'all' as PushAudience,
  scheduleMode: 'now' as PushScheduleMode,
  scheduledAt: '',
})

const snackbar = ref(false)
const snackbarText = ref('')

function openDialog() {
  form.value = { title: '', body: '', imageUrl: '', audience: 'all', scheduleMode: 'now', scheduledAt: '' }
  dialog.value = true
}

async function confirmCreate() {
  if (!form.value.title || !form.value.body) return
  await store.create({
    title: form.value.title,
    body: form.value.body,
    imageUrl: form.value.imageUrl || undefined,
    audience: form.value.audience,
    scheduleMode: form.value.scheduleMode,
    scheduledAt: form.value.scheduleMode === 'scheduled' ? form.value.scheduledAt : undefined,
  })
  dialog.value = false
  snackbarText.value = form.value.scheduleMode === 'scheduled'
    ? 'Кампания запланирована!'
    : 'Кампания отправлена!'
  snackbar.value = true
}

// ── Helpers ──
function formatNum(n: number) {
  return n.toLocaleString('ru-RU')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function openRate(c: { delivered: number; opened: number }) {
  if (!c.delivered) return '—'
  return ((c.opened / c.delivered) * 100).toFixed(1) + '%'
}

function clickRate(c: { opened: number; clicked: number }) {
  if (!c.opened) return '—'
  return ((c.clicked / c.opened) * 100).toFixed(1) + '%'
}

const audienceIcons: Record<PushAudience, string> = {
  all: 'mdi-account-group',
  recent: 'mdi-account-check',
  inactive: 'mdi-account-clock',
}
</script>

<template>
  <div class="pc-page">
    <div v-if="store.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <!-- ══ KPI Stats ══ -->
      <v-row dense class="mb-6">
        <v-col v-for="stat in [
          { label: 'Кампаний', value: store.campaigns.length, icon: 'mdi-send-outline', color: '#ea004b', bg: '#ea004b14' },
          { label: 'Отправлено', value: formatNum(store.totalSent), icon: 'mdi-email-fast-outline', color: '#3b82f6', bg: '#3b82f614' },
          { label: 'Open Rate', value: store.avgOpenRate.toFixed(1) + '%', icon: 'mdi-email-open-outline', color: '#22c55e', bg: '#22c55e14' },
          { label: 'Click Rate', value: store.avgClickRate.toFixed(1) + '%', icon: 'mdi-cursor-default-click', color: '#f97316', bg: '#f9731614' },
        ]" :key="stat.label" cols="6" md="3">
          <v-card flat rounded="xl" class="pa-4 h-100">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="pc-stat-icon" :style="{ background: stat.bg, color: stat.color }">
                <v-icon :icon="stat.icon" size="20" />
              </div>
            </div>
            <p class="pc-stat-value">{{ stat.value }}</p>
            <p class="pc-stat-label">{{ stat.label }}</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- ══ Header + Create button ══ -->
      <div class="pc-section-header mb-4">
        <div>
          <h2 class="pc-section-title">Кампании</h2>
          <p class="pc-section-sub">Push-уведомления для ваших клиентов</p>
        </div>
        <v-btn color="primary" variant="flat" rounded="lg" prepend-icon="mdi-plus" @click="openDialog">
          Создать кампанию
        </v-btn>
      </div>

      <!-- ══ Empty ══ -->
      <div v-if="store.campaigns.length === 0" class="pc-empty">
        <div class="pc-empty__icon">
          <v-icon icon="mdi-bell-badge-outline" size="36" color="grey-lighten-1" />
        </div>
        <p class="pc-empty__title">Нет кампаний</p>
        <p class="pc-empty__sub">Создайте первую push-рассылку для клиентов</p>
      </div>

      <!-- ══ Campaign list ══ -->
      <v-card v-else flat rounded="xl" class="pc-campaigns-card">
        <div v-for="c in store.campaigns" :key="c.id" class="pc-campaign">
          <div class="pc-campaign__icon" :style="{ background: '#3b82f614', color: '#3b82f6' }">
            <v-icon :icon="audienceIcons[c.audience]" size="22" />
          </div>

          <div class="pc-campaign__body">
            <div class="d-flex align-center ga-2 mb-1">
              <span class="pc-campaign__title">{{ c.title }}</span>
              <v-chip :color="PUSH_STATUS_COLORS[c.status]" size="x-small" variant="flat">
                {{ PUSH_STATUS_LABELS[c.status] }}
              </v-chip>
            </div>
            <p class="pc-campaign__meta">
              {{ PUSH_AUDIENCE_LABELS[c.audience] }}
              <template v-if="c.sentAt"> · {{ formatDate(c.sentAt) }}</template>
              <template v-else-if="c.scheduledAt"> · Запланировано: {{ formatDate(c.scheduledAt) }}</template>
            </p>
          </div>

          <div v-if="c.status === 'sent'" class="pc-campaign__stats">
            <div class="pc-campaign__stat">
              <span class="pc-campaign__stat-val">{{ formatNum(c.sent) }}</span>
              <span class="pc-campaign__stat-lbl">Отпр.</span>
            </div>
            <div class="pc-campaign__stat">
              <span class="pc-campaign__stat-val">{{ formatNum(c.delivered) }}</span>
              <span class="pc-campaign__stat-lbl">Доств.</span>
            </div>
            <div class="pc-campaign__stat">
              <span class="pc-campaign__stat-val">{{ openRate(c) }}</span>
              <span class="pc-campaign__stat-lbl">Open</span>
            </div>
            <div class="pc-campaign__stat">
              <span class="pc-campaign__stat-val">{{ clickRate(c) }}</span>
              <span class="pc-campaign__stat-lbl">Click</span>
            </div>
          </div>

          <v-btn
            v-if="c.status === 'scheduled'"
            icon variant="text" size="x-small" color="grey"
            @click="store.cancel(c.id)"
          >
            <v-icon icon="mdi-close" size="18" />
            <v-tooltip activator="parent" location="top">Отменить</v-tooltip>
          </v-btn>
        </div>
      </v-card>
    </template>

    <!-- ══ Create Dialog ══ -->
    <v-dialog v-model="dialog" max-width="520">
      <div class="pc-dialog">
        <div class="pc-dialog__head">
          <div class="pc-dialog__icon" style="background: #3b82f614; color: #3b82f6">
            <v-icon icon="mdi-bell-badge-outline" size="28" />
          </div>
          <h3 class="pc-dialog__title">Новая кампания</h3>
          <p class="pc-dialog__desc">Отправьте push-уведомление вашим клиентам</p>
        </div>

        <div class="pc-dialog__section">
          <v-text-field v-model="form.title" label="Заголовок" variant="outlined" density="compact" rounded="lg" hide-details class="mb-3" />
          <v-textarea v-model="form.body" label="Текст сообщения" variant="outlined" density="compact" rounded="lg" rows="3" hide-details class="mb-3" />
          <v-text-field v-model="form.imageUrl" label="URL изображения (необязательно)" variant="outlined" density="compact" rounded="lg" hide-details />
        </div>

        <div class="pc-dialog__section">
          <p class="pc-dialog__label">Аудитория</p>
          <v-btn-toggle v-model="form.audience" mandatory density="compact" rounded="lg" variant="outlined" divided class="w-100">
            <v-btn value="all" class="flex-grow-1" size="small">Все</v-btn>
            <v-btn value="recent" class="flex-grow-1" size="small">Активные</v-btn>
            <v-btn value="inactive" class="flex-grow-1" size="small">Неактивные</v-btn>
          </v-btn-toggle>
        </div>

        <div class="pc-dialog__section">
          <p class="pc-dialog__label">Время отправки</p>
          <v-btn-toggle v-model="form.scheduleMode" mandatory density="compact" rounded="lg" variant="outlined" divided class="w-100 mb-3">
            <v-btn value="now" class="flex-grow-1" size="small">Сейчас</v-btn>
            <v-btn value="scheduled" class="flex-grow-1" size="small">Запланировать</v-btn>
          </v-btn-toggle>
          <v-text-field
            v-if="form.scheduleMode === 'scheduled'"
            v-model="form.scheduledAt"
            type="datetime-local"
            label="Дата и время"
            variant="outlined"
            density="compact"
            rounded="lg"
            hide-details
          />
        </div>

        <div class="pc-dialog__actions">
          <v-btn variant="tonal" rounded="lg" @click="dialog = false">Отмена</v-btn>
          <v-btn
            color="primary" variant="flat" rounded="lg"
            :loading="store.isSaving"
            :disabled="!form.title || !form.body"
            @click="confirmCreate"
          >
            {{ form.scheduleMode === 'scheduled' ? 'Запланировать' : 'Отправить' }}
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="3000" color="green" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
/* ── Page ── */
.pc-page { padding: 24px 32px; }

/* ── Stats ── */
.pc-stat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.pc-stat-value { font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
.pc-stat-label { font-size: 13px; color: #9ca3af; }

/* ── Section header ── */
.pc-section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.pc-section-title { font-size: 18px; font-weight: 700; color: #1a1a2e; }
.pc-section-sub { font-size: 13px; color: #9ca3af; margin-top: 2px; }

/* ── Campaigns list ── */
.pc-campaigns-card { overflow: hidden; }

.pc-campaign {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  transition: background 0.1s;
}
.pc-campaign:hover { background: #fafafa; }
.pc-campaign + .pc-campaign { border-top: 1px solid #f0f0f0; }

.pc-campaign__icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.pc-campaign__body { flex: 1; min-width: 0; }
.pc-campaign__title { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.pc-campaign__meta { font-size: 12px; color: #9ca3af; }

.pc-campaign__stats { display: flex; gap: 16px; }
.pc-campaign__stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.pc-campaign__stat-val { font-size: 13px; font-weight: 700; color: #1a1a2e; }
.pc-campaign__stat-lbl { font-size: 10px; color: #9ca3af; text-transform: uppercase; }

/* ── Empty ── */
.pc-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 0; text-align: center; }
.pc-empty__icon { width: 72px; height: 72px; border-radius: 20px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.pc-empty__title { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 6px; }
.pc-empty__sub { font-size: 13px; color: #9ca3af; }

/* ── Dialog ── */
.pc-dialog { background: #fff; border-radius: 20px; padding: 28px; }
.pc-dialog__head { text-align: center; margin-bottom: 24px; }
.pc-dialog__icon { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
.pc-dialog__title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
.pc-dialog__desc { font-size: 13px; color: #9ca3af; }
.pc-dialog__section { margin-bottom: 20px; }
.pc-dialog__label { font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
.pc-dialog__actions { display: flex; gap: 12px; justify-content: flex-end; }

/* ── Responsive ── */
@media (max-width: 767px) {
  .pc-page { padding: 16px; }
  .pc-campaign { flex-wrap: wrap; gap: 10px; padding: 14px 16px; }
  .pc-campaign__stats { order: 10; width: 100%; justify-content: space-between; }
  .pc-dialog { padding: 20px; }
  .pc-dialog__actions { flex-direction: column; }
}

/* ── Dark mode ── */
.dark .pc-stat-value,
.dark .pc-section-title,
.dark .pc-campaign__title,
.dark .pc-campaign__stat-val,
.dark .pc-empty__title,
.dark .pc-dialog__title { color: #e4e4e7; }

.dark .pc-stat-label,
.dark .pc-section-sub,
.dark .pc-campaign__meta,
.dark .pc-campaign__stat-lbl,
.dark .pc-empty__sub,
.dark .pc-dialog__desc,
.dark .pc-dialog__label { color: #71717a; }

.dark .pc-campaign:hover { background: #252538; }
.dark .pc-campaign + .pc-campaign { border-top-color: #2e2e42; }
.dark .pc-empty__icon { background: #252538; }
.dark .pc-dialog { background: #1e1e2e; }
</style>
