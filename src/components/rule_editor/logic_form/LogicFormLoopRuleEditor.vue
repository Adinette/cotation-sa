<script lang="ts" setup>
import { FieldConfig, LoopEntry } from '@/utils/type';
import { ref } from 'vue';

const props = defineProps<{
    index: number
    closeDialog: (index: number) => void
    label?: string
    nodeId?: string
    onSubmit?: (data: LoopEntry) => void
}>()
const emit = defineEmits(['update:loop'])
const loop = ref<any[]>([])

const handleSubmit = (data: any) => {
    loop.value.push(data)
    emit('update:loop', loop.value)
    props?.onSubmit?.(data)
    console.log(data);
}

const fields: FieldConfig[] = [
    { name: 'tableName', label: 'Tableau à parcourir', type: 'select', dynamicOptions: true, multiple: false, options: baseItems, },
    { name: 'loopVariable', label: 'Variable de boucle', type: 'text' },
]
</script>

<template>
    <GenericForm :fields="fields" :index="props.index" :closeDialog="props.closeDialog" :onSubmit="handleSubmit" />
</template>
