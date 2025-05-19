<script lang="ts" setup>
import { ConditionEntry } from '@/utils/type';
import { ref, watch } from 'vue';

const items = ref(['frais_fixe', 'capital', 'taux', 'age'])

const emit = defineEmits<{
    (e: 'update:conditions', value: ConditionEntry[]): void
}>()

const currentConditions = ref<ConditionEntry>({
    left: '',
    right: '',
    operation: '',
})

const addedConditions = ref<ConditionEntry[]>([])

watch(addedConditions, (newVal) => {
    emit('update:conditions', newVal)
}, { deep: true })

const submit = () => {
    if (!currentConditions.value.left || !currentConditions.value.right || !currentConditions.value.operation) {
        alert('Veuillez remplir tous les champs.')
        return
    }
    console.log("Condition ajoutée :", currentConditions.value)
    addedConditions.value.push({ ...currentConditions.value })
    currentConditions.value = { left: '', right: '', operation: '' }

}

</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Select v-model="currentConditions.left" :items="items" label="Variable de gauche" :multiple="false"
                class="mb-2" />
            <Select v-model="currentConditions.right" :items="items" label="Variable de droite" :multiple="false"
                class="mb-2" />

            <TextField label="Type d'opération" v-model="currentConditions.operation" class="mb-2" />

            <v-btn color="success" @click="submit" variant="tonal" class="success-button">
                Ajouter
            </v-btn>
        </div>
    </div>
</template>

<style scoped>
.success-button:disabled {
    cursor: pointer;
}
</style>
