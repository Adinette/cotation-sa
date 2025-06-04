<!-- components/GenericForm.vue -->
<script lang="ts" setup>
import { FieldConfig } from '@/utils/type';
import { loadStoredVariables, storeVariable } from '@/utils/variables';
import { onMounted, ref } from 'vue';

const props = defineProps<{
    fields: FieldConfig[]
    index: number
    closeDialog: (index: number) => void
    initialValues?: Record<string, any>,
    onSubmit?: (data: Record<string, any>) => void
}>()

const formData = ref<Record<string, any>>({ ...(props.initialValues || {}) });
const optionItems = ref<Record<string, string[]>>({})

onMounted(() => {
    props.fields.forEach(field => {
        if (formData.value[field.name] === undefined) {
            formData.value[field.name] = ''
        }
        if (field.type === 'select') {
            const stored = field.dynamicOptions ? loadStoredVariables() : []
            optionItems.value[field.name] = Array.from(new Set([...(field.options || []), ...stored]))
        }
    })
})

const submit = () => {
    const missing = props.fields.find(field => !formData.value[field.name])
    if (missing) {
        alert(`Veuillez remplir le champ "${missing.label}"`)
        return
    }
    const dynamicField = props.fields.find(f => f.dynamicOptions)
    if (dynamicField) {
        storeVariable(formData.value[dynamicField.name])
    }

    props.onSubmit?.({ ...formData.value })
    props.closeDialog(props.index)

    for (const key in formData.value) {
        formData.value[key] = ''
    }
}
</script>

<template>
    <div class="p-4">
        <form @submit.prevent="submit">
            <div v-for="field in fields" :key="field.name" class="mb-2">
                <TextField v-if="field.type === 'text'" v-model="formData[field.name]" :label="field.label" />
                <Select v-else-if="field.type === 'select'" v-model="formData[field.name]"
                    :items="optionItems[field.name] || []" :label="field.label" :multiple="field.multiple ?? false" />
                <Textearea v-else-if="field.type === 'textarea'" v-model="formData[field.name]" :label="field.label" />
            </div>

            <v-btn color="success" type="submit" variant="tonal" class="success-button">
                Ajouter
            </v-btn>
        </form>
    </div>
</template>

<style scoped>
.success-button:disabled {
    cursor: pointer;
}
</style>
