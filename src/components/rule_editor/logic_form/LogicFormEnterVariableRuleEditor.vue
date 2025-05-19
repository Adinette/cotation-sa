<script lang="ts" setup>
import { LogicButton, VariableEntry } from '@/utils/type';
import { ref } from 'vue';

const enterVariables = ref([
    { label: "Âge de l'assuré", key: "age" },
    { label: "Capital de l'assuré", key: "capital" },
    { label: "Taux", key: "taux" },
    { label: "Frais fixes", key: "frais_fixes" }
]);

const emit = defineEmits<{
    (e: 'update:variables', vars: VariableEntry[]): void;
    (e: 'update:conditions', vars: VariableEntry[]): void;
}>();

const handleVariableUpdate = (vars: VariableEntry[]) => {
    emit('update:variables', vars);
};

const selectedVariableLabel = ref<string | undefined>(undefined)

const dialogStates = ref<boolean[]>(LogicButton.map(() => false));

function openDialog(index: number) {
    selectedVariableLabel.value = enterVariables.value[index].key
    console.log(selectedVariableLabel, "selectedVariableLabel");

    dialogStates.value[index] = true
}
function closeDialog(index: number) {
    dialogStates.value[index] = false;
}
</script>

<template>
    <div>
        <div class="enter-variable my-4">
            <h3 class="text-md font-bold mr-2">Variables d'entrée :</h3>
            <div>
                <v-btn v-for="(variable, index) in enterVariables" :key="variable.label" color="grey-lighten-3"
                    variant="tonal" size="x-small" class="mr-2" @click="openDialog(index)">
                    {{ variable.label }}
                </v-btn>
            </div>
        </div>

        <div v-for="(btn, index) in LogicButton" :key="index">
            <v-dialog v-model="dialogStates[index]" max-width="500">
                <v-card :title="btn.label">
                    <v-card-text>
                        <LogicFormRuleEditor type="variable" :defaultOperand="selectedVariableLabel"
                            @update:variables="handleVariableUpdate" />
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn text="Fermer" @click="closeDialog(index)" />
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>
<style scoped>
.enter-variable {
    display: flex;
}
</style>
