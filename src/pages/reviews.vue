<script lang="ts" setup>
import { useReviewsStore } from '@/stores/reviews'
import { useRestaurantStore } from '@/stores/restaurant'
import { ORDER_TYPE_LABELS, ORDER_TYPE_COLORS } from '@/types'
import type { OrderType, Review } from '@/types'

const reviewsStore = useReviewsStore()
const restaurantStore = useRestaurantStore()

onMounted(async () => {
  await Promise.all([
    reviewsStore.loadReviews(),
    restaurantStore.loadRestaurant(),
  ])
})

const ORDER_TYPE_ICONS: Record<OrderType, string> = {
  delivery: 'mdi-moped',
  pickup: 'mdi-walk',
  dine_in: 'mdi-silverware-fork-knife',
}

// Filters
type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1'
type ReplyFilter = 'all' | 'replied' | 'unreplied'

const ratingFilter = ref<RatingFilter>('all')
const replyFilter = ref<ReplyFilter>('all')
const search = ref('')

const ratingFilters: { value: RatingFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: '5', label: '5 ★' },
  { value: '4', label: '4 ★' },
  { value: '3', label: '3 ★' },
  { value: '2', label: '2 ★' },
  { value: '1', label: '1 ★' },
]

const filteredReviews = computed(() => {
  let result = reviewsStore.sortedReviews

  if (ratingFilter.value !== 'all') {
    const rating = parseInt(ratingFilter.value)
    result = result.filter(r => r.rating === rating)
  }

  if (replyFilter.value === 'replied') {
    result = result.filter(r => r.reply)
  } else if (replyFilter.value === 'unreplied') {
    result = result.filter(r => !r.reply)
  }

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(r =>
      r.author.toLowerCase().includes(q) ||
      r.text.toLowerCase().includes(q) ||
      r.orderNumber.toString().includes(q),
    )
  }

  return result
})

// Reply dialog
const replyDialog = ref(false)
const replyTarget = ref<Review | null>(null)
const replyText = ref('')
const isReplying = ref(false)

function openReplyDialog(review: Review) {
  replyTarget.value = review
  replyText.value = review.reply || ''
  replyDialog.value = true
}

async function submitReply() {
  if (!replyTarget.value || !replyText.value.trim()) return
  isReplying.value = true
  await reviewsStore.replyToReview(replyTarget.value.id, replyText.value.trim())
  isReplying.value = false
  replyDialog.value = false
}

// Helpers
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  if (days < 7) return `${days} дн. назад`
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`
  return `${Math.floor(days / 30)} мес. назад`
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getRatingColor(rating: number): string {
  if (rating >= 4) return '#16a34a'
  if (rating === 3) return '#F97316'
  return '#dc2626'
}

// Rating bar max for distribution
const maxRatingCount = computed(() =>
  Math.max(...reviewsStore.ratingDistribution, 1),
)
</script>

<template>
  <div class="rv-page">
    <div v-if="reviewsStore.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <!-- Stats row -->
      <v-row dense class="mb-6">
        <!-- Overall rating card -->
        <v-col cols="12" md="4">
          <v-card flat rounded="xl" class="rv-stat-card h-100">
            <div class="rv-stat-card__body">
              <div class="rv-rating-big">
                <span class="rv-rating-big__value">{{ reviewsStore.averageRating }}</span>
                <span class="rv-rating-big__max">/ 5</span>
              </div>
              <div class="rv-rating-stars">
                <v-icon
                  v-for="i in 5"
                  :key="i"
                  :icon="i <= Math.round(reviewsStore.averageRating) ? 'mdi-star' : 'mdi-star-outline'"
                  size="20"
                  :color="i <= Math.round(reviewsStore.averageRating) ? '#F97316' : '#d4d4d8'"
                />
              </div>
              <p class="rv-stat-sub">{{ reviewsStore.reviews.length }} отзывов</p>
            </div>
          </v-card>
        </v-col>

        <!-- Rating distribution -->
        <v-col cols="12" md="4">
          <v-card flat rounded="xl" class="rv-stat-card h-100">
            <p class="rv-stat-card__title">Распределение оценок</p>
            <div class="rv-distribution">
              <div
                v-for="star in [5, 4, 3, 2, 1]"
                :key="star"
                class="rv-dist-row"
              >
                <span class="rv-dist-label">{{ star }} ★</span>
                <div class="rv-dist-bar">
                  <div
                    class="rv-dist-bar__fill"
                    :style="{
                      width: (reviewsStore.ratingDistribution[star - 1] / maxRatingCount) * 100 + '%',
                      background: getRatingColor(star),
                    }"
                  />
                </div>
                <span class="rv-dist-count">{{ reviewsStore.ratingDistribution[star - 1] }}</span>
              </div>
            </div>
          </v-card>
        </v-col>

        <!-- Quick stats -->
        <v-col cols="12" md="4">
          <v-card flat rounded="xl" class="rv-stat-card h-100">
            <p class="rv-stat-card__title">Обзор</p>
            <div class="rv-quick-stats">
              <div class="rv-quick-stat">
                <div class="rv-quick-stat__icon" style="background: #e8f5e9">
                  <v-icon icon="mdi-message-reply-text-outline" size="20" color="#16a34a" />
                </div>
                <div>
                  <p class="rv-quick-stat__value">{{ reviewsStore.repliedCount }}</p>
                  <p class="rv-quick-stat__label">С ответом</p>
                </div>
              </div>
              <div class="rv-quick-stat">
                <div class="rv-quick-stat__icon" style="background: #fff3e0">
                  <v-icon icon="mdi-message-alert-outline" size="20" color="#F97316" />
                </div>
                <div>
                  <p class="rv-quick-stat__value">{{ reviewsStore.unrepliedCount }}</p>
                  <p class="rv-quick-stat__label">Без ответа</p>
                </div>
              </div>
              <div class="rv-quick-stat">
                <div class="rv-quick-stat__icon" style="background: #fce4ec">
                  <v-icon icon="mdi-star-outline" size="20" color="#EA004B" />
                </div>
                <div>
                  <p class="rv-quick-stat__value">{{ restaurantStore.restaurant?.rating ?? '—' }}</p>
                  <p class="rv-quick-stat__label">Рейтинг</p>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filters & search -->
      <v-card flat rounded="xl" class="rv-main-card">
        <div class="rv-toolbar">
          <div class="rv-filters">
            <div
              v-for="f in ratingFilters"
              :key="f.value"
              class="rv-filter"
              :class="{ 'rv-filter--active': ratingFilter === f.value }"
              @click="ratingFilter = f.value"
            >
              {{ f.label }}
            </div>

            <div class="rv-filter-divider" />

            <div
              class="rv-filter"
              :class="{ 'rv-filter--active': replyFilter === 'unreplied' }"
              @click="replyFilter = replyFilter === 'unreplied' ? 'all' : 'unreplied'"
            >
              <v-icon icon="mdi-message-alert-outline" size="14" />
              Без ответа
            </div>
          </div>

          <v-text-field
            v-model="search"
            placeholder="Поиск по автору, тексту..."
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            rounded="lg"
            hide-details
            class="rv-search"
            bg-color="white"
          />
        </div>

        <v-divider />

        <!-- Empty state -->
        <div v-if="filteredReviews.length === 0" class="rv-empty">
          <v-icon icon="mdi-message-text-outline" size="44" color="grey-lighten-2" />
          <p class="rv-empty__text">Нет отзывов по выбранному фильтру</p>
        </div>

        <!-- Reviews list -->
        <div v-else class="rv-list">
          <div
            v-for="review in filteredReviews"
            :key="review.id"
            class="rv-review"
          >
            <!-- Review header -->
            <div class="rv-review__header">
              <div class="rv-review__author">
                <div class="rv-review__avatar">{{ getInitials(review.author) }}</div>
                <div>
                  <p class="rv-review__name">{{ review.author }}</p>
                  <div class="rv-review__meta">
                    <span class="rv-review__date">{{ timeAgo(review.date) }}</span>
                    <span class="rv-review__dot">·</span>
                    <span class="rv-review__order">#{{ review.orderNumber }}</span>
                    <span class="rv-review__dot">·</span>
                    <div class="rv-review__type" :style="{ '--type-color': ORDER_TYPE_COLORS[review.orderType] }">
                      <v-icon :icon="ORDER_TYPE_ICONS[review.orderType]" size="11" />
                      {{ ORDER_TYPE_LABELS[review.orderType] }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="rv-review__right">
                <div class="rv-review__rating" :style="{ background: getRatingColor(review.rating) }">
                  <v-icon icon="mdi-star" size="13" color="white" />
                  {{ review.rating }}.0
                </div>
                <span class="rv-review__date-full">{{ formatDate(review.date) }}</span>
              </div>
            </div>

            <!-- Review text -->
            <p class="rv-review__text">"{{ review.text }}"</p>

            <!-- Ordered items -->
            <div class="rv-review__items">
              <span
                v-for="item in review.items"
                :key="item"
                class="rv-review__item-tag"
              >{{ item }}</span>
            </div>

            <!-- Reply (if exists) -->
            <div v-if="review.reply" class="rv-reply">
              <div class="rv-reply__header">
                <v-icon icon="mdi-reply" size="14" />
                <span class="rv-reply__label">Ответ заведения</span>
                <span class="rv-reply__date">{{ formatDateShort(review.repliedAt!) }}</span>
              </div>
              <p class="rv-reply__text">{{ review.reply }}</p>
            </div>

            <!-- Reply button -->
            <div class="rv-review__actions">
              <button
                class="rv-reply-btn"
                @click="openReplyDialog(review)"
              >
                <v-icon :icon="review.reply ? 'mdi-pencil-outline' : 'mdi-reply'" size="14" />
                {{ review.reply ? 'Редактировать ответ' : 'Ответить' }}
              </button>
            </div>
          </div>
        </div>
      </v-card>

      <!-- Reply dialog -->
      <v-dialog v-model="replyDialog" max-width="560">
        <div class="rv-dialog">
          <div class="rv-dialog__header">
            <h3 class="rv-dialog__title">{{ replyTarget?.reply ? 'Редактировать ответ' : 'Ответить на отзыв' }}</h3>
            <button class="rv-dialog__close" @click="replyDialog = false">
              <v-icon icon="mdi-close" size="20" />
            </button>
          </div>

          <!-- Original review preview -->
          <div v-if="replyTarget" class="rv-dialog__preview">
            <div class="d-flex align-center ga-2 mb-2">
              <div class="rv-dialog__avatar">{{ getInitials(replyTarget.author) }}</div>
              <span class="rv-dialog__author">{{ replyTarget.author }}</span>
              <div class="rv-review__rating rv-review__rating--sm" :style="{ background: getRatingColor(replyTarget.rating) }">
                <v-icon icon="mdi-star" size="11" color="white" />
                {{ replyTarget.rating }}.0
              </div>
            </div>
            <p class="rv-dialog__review-text">"{{ replyTarget.text }}"</p>
          </div>

          <v-textarea
            v-model="replyText"
            label="Ваш ответ"
            variant="outlined"
            rounded="lg"
            rows="4"
            counter="500"
            maxlength="500"
            hide-details="auto"
            class="mb-4"
          />

          <div class="rv-dialog__actions">
            <button class="rv-dialog__btn rv-dialog__btn--cancel" @click="replyDialog = false">
              Отмена
            </button>
            <button
              class="rv-dialog__btn rv-dialog__btn--submit"
              :disabled="!replyText.trim() || isReplying"
              @click="submitReply"
            >
              <v-progress-circular v-if="isReplying" indeterminate size="16" width="2" color="white" class="mr-2" />
              {{ replyTarget?.reply ? 'Сохранить' : 'Отправить' }}
            </button>
          </div>
        </div>
      </v-dialog>
    </template>
  </div>
</template>

<style scoped>
/* ── Stat cards ── */
.rv-stat-card {
  padding: 24px;
}

.rv-stat-card__title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.rv-stat-card__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
}

.rv-rating-big {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.rv-rating-big__value {
  font-size: 48px;
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1;
  letter-spacing: -1px;
}

.rv-rating-big__max {
  font-size: 18px;
  font-weight: 500;
  color: #9ca3af;
}

.rv-rating-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 8px;
}

.rv-stat-sub {
  font-size: 13px;
  color: #9ca3af;
}

/* Distribution */
.rv-distribution {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rv-dist-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rv-dist-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  width: 30px;
  text-align: right;
  flex-shrink: 0;
}

.rv-dist-bar {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: #f3f4f6;
  overflow: hidden;
}

.rv-dist-bar__fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  min-width: 2px;
}

.rv-dist-count {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

/* Quick stats */
.rv-quick-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rv-quick-stat {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rv-quick-stat__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rv-quick-stat__value {
  font-size: 20px;
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1.2;
}

.rv-quick-stat__label {
  font-size: 12px;
  color: #9ca3af;
}

/* ── Main card ── */
.rv-main-card {
  overflow: hidden;
}

/* Toolbar */
.rv-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  gap: 16px;
}

.rv-filters {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rv-filter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.12s;
  user-select: none;
  white-space: nowrap;
}

.rv-filter:hover {
  background: #f3f4f6;
}

.rv-filter--active {
  background: #EA004B;
  color: white;
}

.rv-filter-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 4px;
}

.rv-search {
  max-width: 280px;
}

/* Empty */
.rv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 0;
}

.rv-empty__text {
  font-size: 14px;
  color: #9ca3af;
  margin-top: 12px;
}

/* ── Reviews list ── */
.rv-list {
  padding: 0 24px;
}

.rv-review {
  padding: 24px 0;
  border-bottom: 1px solid #f0f0f0;
}

.rv-review:last-child {
  border-bottom: none;
}

/* Review header */
.rv-review__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.rv-review__author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rv-review__avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ea004b, #ff4081);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rv-review__name {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 3px;
}

.rv-review__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.rv-review__date {
  font-size: 12px;
  color: #9ca3af;
}

.rv-review__dot {
  font-size: 12px;
  color: #d4d4d8;
}

.rv-review__order {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.rv-review__type {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  color: var(--type-color);
  background: color-mix(in srgb, var(--type-color) 10%, transparent);
  padding: 2px 8px;
  border-radius: 5px;
}

.rv-review__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.rv-review__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.rv-review__rating--sm {
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 6px;
}

.rv-review__date-full {
  font-size: 11px;
  color: #9ca3af;
}

/* Review text */
.rv-review__text {
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  margin-bottom: 12px;
  font-style: italic;
}

/* Ordered items */
.rv-review__items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.rv-review__item-tag {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  padding: 3px 10px;
  border-radius: 6px;
}

/* Reply block */
.rv-reply {
  background: #f9fafb;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-left: 3px solid #EA004B;
}

.rv-reply__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #EA004B;
}

.rv-reply__label {
  font-size: 12px;
  font-weight: 700;
  color: #EA004B;
}

.rv-reply__date {
  font-size: 11px;
  color: #9ca3af;
  margin-left: auto;
}

.rv-reply__text {
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
}

/* Actions */
.rv-review__actions {
  display: flex;
  gap: 8px;
}

.rv-reply-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
}

.rv-reply-btn:hover {
  background: color-mix(in srgb, #EA004B 5%, transparent);
  border-color: color-mix(in srgb, #EA004B 20%, transparent);
  color: #EA004B;
}

/* ── Dialog ── */
.rv-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
}

.rv-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.rv-dialog__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.rv-dialog__close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.rv-dialog__close:hover {
  background: #f3f4f6;
  color: #374151;
}

.rv-dialog__preview {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.rv-dialog__avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ea004b, #ff4081);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rv-dialog__author {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

.rv-dialog__review-text {
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
  font-style: italic;
}

.rv-dialog__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.rv-dialog__btn {
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
}

.rv-dialog__btn--cancel {
  background: #f3f4f6;
  color: #374151;
}

.rv-dialog__btn--cancel:hover {
  background: #e5e7eb;
}

.rv-dialog__btn--submit {
  background: #EA004B;
  color: #fff;
}

.rv-dialog__btn--submit:hover:not(:disabled) {
  background: #d1003f;
}

.rv-dialog__btn--submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Dark Theme ── */
.dark .rv-stat-card__title {
  color: #e4e4e7;
}

.dark .rv-rating-big__value {
  color: #e4e4e7;
}

.dark .rv-dist-bar {
  background: #252538;
}

.dark .rv-dist-count {
  color: #a1a1aa;
}

.dark .rv-quick-stat__value {
  color: #e4e4e7;
}

.dark .rv-filter {
  color: #a1a1aa;
}

.dark .rv-filter:hover {
  background: #252538;
}

.dark .rv-filter-divider {
  background: #2e2e42;
}

.dark .rv-search :deep(.v-field) {
  background: #252538 !important;
}

.dark .rv-review {
  border-bottom-color: #2e2e42;
}

.dark .rv-review__name {
  color: #e4e4e7;
}

.dark .rv-review__order {
  color: #a1a1aa;
}

.dark .rv-review__text {
  color: #a1a1aa;
}

.dark .rv-review__item-tag {
  color: #a1a1aa;
  background: #252538;
}

.dark .rv-reply {
  background: #252538;
}

.dark .rv-reply__text {
  color: #a1a1aa;
}

.dark .rv-reply-btn {
  border-color: #2e2e42;
  background: #1e1e2e;
  color: #a1a1aa;
}

.dark .rv-reply-btn:hover {
  background: color-mix(in srgb, #EA004B 10%, #1e1e2e);
  border-color: color-mix(in srgb, #EA004B 25%, #2e2e42);
  color: #EA004B;
}

.dark .rv-dialog {
  background: #1e1e2e;
}

.dark .rv-dialog__title {
  color: #e4e4e7;
}

.dark .rv-dialog__close:hover {
  background: #252538;
}

.dark .rv-dialog__preview {
  background: #252538;
}

.dark .rv-dialog__author {
  color: #e4e4e7;
}

.dark .rv-dialog__btn--cancel {
  background: #252538;
  color: #a1a1aa;
}

.dark .rv-dialog__btn--cancel:hover {
  background: #2e2e42;
}

/* ── Responsive ── */
.rv-page {
  padding: 24px 32px;
}

@media (max-width: 767px) {
  .rv-page {
    padding: 16px;
  }

  .rv-toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 14px;
    gap: 10px;
  }

  .rv-filters {
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .rv-filter-divider {
    display: none;
  }

  .rv-search {
    max-width: 100%;
  }
}
</style>
