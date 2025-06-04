<!--ReturnForm.vue -->
<script lang="ts" setup>
import { FieldConfig } from '@/utils/type';
import { ref } from 'vue';

const props = defineProps<{
    index: number
    defaultOperand?: string
    closeDialog: (index: number) => void
    onSubmit?: (data: any) => void
}>()

const emit = defineEmits(['update:returns'])
const returns = ref<any[]>([])
const handleSubmit = (data: any) => {
    returns.value.push(data)
    emit('update:returns', returns.value)
    props?.onSubmit?.(data)
}

const fields: FieldConfig[] = [
    { name: 'name', label: 'Nom de la variable', type: 'select', dynamicOptions: true, multiple: false, options: baseItems, },
]
</script>

<template>
    <GenericForm :fields="fields" :index="props.index" :closeDialog="props.closeDialog" :onSubmit="handleSubmit" />
</template>
