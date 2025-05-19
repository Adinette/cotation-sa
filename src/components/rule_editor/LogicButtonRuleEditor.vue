<script lang="ts" setup>
import { VariantType } from '@/utils/type'
import { defineEmits, defineProps } from 'vue'


const props = defineProps({
    label: {
        type: String,
        required: true,
    },
    variant: {
        type: String as PropType<VariantType>,
        default: 'tonal',
    },
    icon: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        default: ''
    },
    under: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])

function handleClick() {
    emit('click')
}


</script>

<template>

    <v-btn :class="['mb-3', { under }]" :variant="variant" @click="handleClick">
        <v-icon v-if="icon" start>{{ icon }}</v-icon>
        {{ label }}
    </v-btn>

</template>

<style scoped>
.btn {
    display: grid;
}

.under {
    width: 50%;
}
</style>
