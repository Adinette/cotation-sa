<!-- VariableForm.vue -->
<script lang="ts" setup>
import { FieldConfig } from '@/utils/type';
import { ref } from 'vue';

const props = defineProps<{
    index: number
    defaultOperand?: string
    closeDialog: (index: number) => void
    onSubmit?: (data: any) => void
}>()

const emit = defineEmits(['update:variables'])
const variables = ref<any[]>([])
const initialValues = ref<Record<string, any>>({});

watch(
    () => props.defaultOperand,
    (newVal) => {
        if (newVal !== undefined) {
            initialValues.value.name = newVal;
        }
    },
    { immediate: true }
);

const handleSubmit = (data: any) => {
    variables.value.push(data)
    emit('update:variables', variables.value)
    props?.onSubmit?.(data)
}

const fields: FieldConfig[] = [
    { name: 'name', label: 'Nom de la variable', type: 'select', dynamicOptions: true, multiple: false, options: baseItems, },
    { name: 'operation', label: 'Définition', type: 'textarea' },
]
</script>

<template>
    <GenericForm :fields="fields" :index="props.index" :closeDialog="props.closeDialog" :onSubmit="handleSubmit"
        :initialValues="initialValues" />
</template>
