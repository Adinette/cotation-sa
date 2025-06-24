<!-- ConditionForm.vue -->
<script lang="ts" setup>
import { comparisonOperations, ConditionEntry, FieldConfig } from '@/utils/type';
import { ref } from 'vue';

const props = defineProps<{
    index: number
    defaultConditions?: ConditionEntry
    closeDialog: (index: number) => void
    onSubmit?: (data: any) => void
}>()

const emit = defineEmits(['update:conditions'])
const conditions = ref<any[]>([])

const handleSubmit = (data: any) => {
    conditions.value.push(data)
    emit('update:conditions', conditions.value)
    props?.onSubmit?.(data)
}

const fields: FieldConfig[] = [
    { name: 'operation', label: 'Type d\'opération', type: 'select', options: comparisonOperations.value },
    { name: 'left', label: 'Variable de gauche', type: 'select', dynamicOptions: true, multiple: false, options: baseItems, },
    { name: 'right', label: 'Variable de droite', type: 'select', dynamicOptions: true, multiple: false, options: baseItems, },
]
</script>

<template>
    <GenericForm :fields="fields" :index="props.index" :closeDialog="props.closeDialog"
        :initialValues="defaultConditions" :onSubmit="handleSubmit" />
</template>
