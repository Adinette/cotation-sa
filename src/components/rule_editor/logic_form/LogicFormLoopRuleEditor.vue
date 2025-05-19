<script lang="ts" setup>
import { LoopEntry } from '@/utils/type';
import { ref, watch } from 'vue';

const items = ref(['frais_fixe', 'capital', 'taux', 'age'])

const emit = defineEmits<{
    (e: 'update:loop', value: LoopEntry[]): void
}>()

const currentloop = ref<LoopEntry>({
    collectionsName: '',
    collectionsType: '',
    collectionsValues: [],
    loopVariable: '',
    loopVariableType: ''

})

const addedloop = ref<LoopEntry[]>([])

watch(addedloop, (newVal) => {
    emit('update:loop', newVal)
}, { deep: true })

const submit = () => {
    if (!currentloop.value.collectionsName || !currentloop.value.collectionsType || !currentloop.value.collectionsValues || !currentloop.value.loopVariable || !currentloop.value.loopVariableType) {
        alert('Veuillez remplir tous les champs.')
        return
    }
    console.log("Boucle ajoutée :", currentloop.value)
    addedloop.value.push({ ...currentloop.value })
    currentloop.value = { collectionsName: '', collectionsType: '', collectionsValues: [], loopVariable: '', loopVariableType: '' }

}

</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <TextField label="Nom de la variable (collections)" v-model="currentloop.collectionsName" class="mb-2" />
            <TextField label="Type de la variable" v-model="currentloop.collectionsType" class="mb-2" />
            <Select v-model="currentloop.collectionsValues" :items="items" label="Valeur collections" :multiple="true"
                class="mb-2" />
            <TextField label="Variable de boucle" v-model="currentloop.loopVariable" class="mb-2" />
            <TextField label="Type de la variable" v-model="currentloop.loopVariableType" class="mb-2" />

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
