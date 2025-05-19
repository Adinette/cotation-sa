<script lang="ts" setup>
import { ReturnEntry } from '@/utils/type';
import { ref, watch } from 'vue';

const emit = defineEmits<{
    (e: 'update:return', value: ReturnEntry[]): void
}>()

const items = ref(['frais_fixe', 'capital', 'taux', 'age'])

const currentReturn = ref<ReturnEntry>({
    name: '',
    type: '',
})

const addedReturn = ref<ReturnEntry[]>([])

watch(addedReturn, (newVal) => {
    emit('update:return', newVal)
}, { deep: true })

const submit = () => {
    if (!currentReturn.value.name || !currentReturn.value.type) {
        alert('Veuillez remplir tous les champs.')
        return
    }
    console.log("Variable ajoutée :", currentReturn.value)
    addedReturn.value.push({ ...currentReturn.value })
    currentReturn.value = { name: '', type: '' }

}
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Select v-model="currentReturn.name" :items="items" label="Nom de la variable" :multiple="false"
                class="mb-2" />
            <TextField label="Type de la variable" v-model="currentReturn.type" class="mb-2" />
            <v-btn color="success" @click="submit" variant="tonal" class="success-button">
                Ajouter
            </v-btn>
        </div>
    </div>
</template>
