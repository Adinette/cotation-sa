<script lang="ts" setup>
import { VariableEntry } from '@/utils/type';
import { onMounted, ref, watch } from 'vue';

const items = ref(['frais_fixe', 'capital', 'taux', 'age'])
const selectedOperands = ref<string[]>([])
const props = defineProps<{
    defaultOperand?: string
}>()

watch(
    () => props.defaultOperand,
    (newVal) => {
        if (newVal) {
            selectedOperands.value = [newVal]
            console.log('defaultOperand détecté :', newVal)
        }
    },
    { immediate: true }
)

onMounted(() => {
    console.log('Composant monté avec defaultOperand:', props.defaultOperand)
})

const emit = defineEmits<{
    (e: 'update:variables', value: VariableEntry[]): void
}>()

const currentVariable = ref<VariableEntry>({
    name: '',
    type: '',
    operation: '',
    operand: []
})

const addedVariables = ref<VariableEntry[]>([])

watch(addedVariables, (newVal) => {
    emit('update:variables', newVal)
}, { deep: true })

const submit = () => {
    if (!currentVariable.value.name || !currentVariable.value.type) {
        alert('Veuillez remplir tous les champs.')
        return
    }
    currentVariable.value.operand = [...selectedOperands.value]
    console.log("Variable ajoutée :", currentVariable.value)
    addedVariables.value.push({ ...currentVariable.value })
    currentVariable.value = { name: '', type: '', operand: [], operation: '' }
    currentVariable.value.operand = [...selectedOperands.value]

}
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <TextField label="Nom de la variable" v-model="currentVariable.name" class="mb-2" />
            <TextField label="Type de la variable" v-model="currentVariable.type" class="mb-2" />
            <Select v-model="selectedOperands" :items="items" label="Opérande" :multiple="true" class="mb-2" />
            <TextField label="Type d'opération" v-model="currentVariable.operation" class="mb-2" />
            <v-btn color="success" @click="submit" variant="tonal" class="success-button">
                Ajouter
            </v-btn>
        </div>
    </div>
</template>
