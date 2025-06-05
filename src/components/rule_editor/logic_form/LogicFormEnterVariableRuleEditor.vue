<script lang="ts" setup>
import { enterVariables, LogicButton } from '@/utils/type';
import { ref } from 'vue';

const props = defineProps<{
    defaultOperand?: string
}>()

const selectedVariableLabel = ref<string | undefined>(undefined)
const dialogStates = ref<boolean[]>(LogicButton.map(() => false));

const emit = defineEmits<{}>();

const handleVariables = handleVariablesUpdate(emit, formVariables);

function openDialog(index: number) {
    selectedVariableLabel.value = enterVariables.value[index].key
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
            <LogicDialog v-model="dialogStates[index]" title="Variable" :index="index" @close="closeDialog(index)">
                <LogicFormRuleEditor type="variable" :defaultOperand="selectedVariableLabel"
                    :onSubmitVariable="handleVariableSubmit" @update:variables="handleVariables" :onClose="closeDialog"
                    :index="index" />
            </LogicDialog>
        </div>
    </div>
</template>
<style scoped>
.enter-variable {
    display: flex;
}
</style>
