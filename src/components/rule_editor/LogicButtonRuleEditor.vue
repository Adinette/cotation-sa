<script lang="ts" setup>
import type { VariantType } from '@/utils/type';

const props = defineProps<{
    label: string,
    variant?: VariantType,
    icon?: string,
    type?: string,
    under?: boolean,
    disabled?: boolean,
}>()

const emit = defineEmits(['click'])

function handleClick() {
    emit('click')
}
</script>

<template>
    <v-btn :class="['mb-3', { under }]" :variant="variant ?? 'tonal'" @click="handleClick" :disabled="disabled">
        <v-icon v-if="icon" start>{{ icon }}</v-icon>
        {{ label }}
    </v-btn>
</template>
