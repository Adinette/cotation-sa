<script setup lang="ts">
const props = defineProps<{
    modelValue: string | string[],
    label: string,
    items: string[],
    multiple: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const internalValue = computed<string[] | string>({
    get() {
        if (props.multiple) {
            return props.modelValue as string[]
        } else {
            return props.modelValue as string
        }
    },
    set(val: string[] | string) {
        if (props.multiple) {
            emit('update:modelValue', val as string[])
        } else {
            emit('update:modelValue', val as string)
        }
    }
})

</script>

<template>
    <v-combobox :label="label" :items="items" :multiple="multiple" :model-value="internalValue"
        @update:model-value="val => (internalValue = val)" />
</template>
