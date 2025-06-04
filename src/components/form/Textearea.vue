<script setup lang="ts">
import { enterVariables } from '@/utils/type';
import { extractVariables } from '@/utils/variables';
import { defineEmits, defineProps, ref, watch } from 'vue';

// 📌 Props
const props = defineProps<{
    label: string
    modelValue: string
}>()


// 📢 Emit pour v-model
const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

// 🔁 Liaison locale avec la prop modelValue
const inputValue = ref(props.modelValue)

const detectedVariables = ref<{ id: string; title: string }[]>([])

// 🔁 Met à jour la valeur interne si modelValue change depuis le parent
watch(() => props.modelValue, (val) => {
    inputValue.value = val
})


// Détecte automatiquement les variables présentes dans le texte
watch(inputValue, (newVal) => {
    emit('update:modelValue', newVal)

    const varsInText = extractVariables(newVal)

    detectedVariables.value = enterVariables.value
        .filter(v => varsInText.includes(v.key.toLowerCase()))
        .map(v => ({ id: v.key, title: v.label }))
})
</script>


<template>
    <div>
        <VTextarea v-model="inputValue" :label="label" rows="3" />
        <div v-if="detectedVariables.length > 0" class="mt-2">
            <VChip v-for="(item, index) in detectedVariables" :key="index" color="primary" class="mr-1">
                {{ item.title }}
            </VChip>
        </div>
    </div>
</template>
