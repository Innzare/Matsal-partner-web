<script lang="ts" setup>
const props = defineProps<{
  modelValue: boolean
  title: string
  text?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
  showInput?: boolean
  inputLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [inputValue?: string]
  cancel: []
}>()

const inputValue = ref('')

const close = () => {
  emit('update:modelValue', false)
  emit('cancel')
  inputValue.value = ''
}

const confirm = () => {
  emit('update:modelValue', false)
  emit('confirm', inputValue.value || undefined)
  inputValue.value = ''
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="xl">
      <v-card-title class="pt-5 px-6">{{ title }}</v-card-title>
      <v-card-text v-if="text || showInput" class="px-6">
        <p v-if="text" class="text-body-2 text-grey-darken-1 mb-3">{{ text }}</p>
        <v-textarea
          v-if="showInput"
          v-model="inputValue"
          :label="inputLabel || 'Комментарий'"
          variant="outlined"
          rows="3"
          hide-details
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="close">{{ cancelText || 'Отмена' }}</v-btn>
        <v-btn
          :color="confirmColor || 'primary'"
          variant="flat"
          @click="confirm"
          :disabled="showInput && !inputValue.trim()"
        >
          {{ confirmText || 'Подтвердить' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
