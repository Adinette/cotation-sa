<script lang="ts" setup>
import { ConditionEntry, LogicButton, LoopEntry, ReturnEntry, VariableEntry } from '@/utils/type';
import { ref } from 'vue';
import LogicFormRuleEditor from './logic_form/LogicFormRuleEditor.vue';

const emit = defineEmits<{
    (e: 'update:variables', vars: VariableEntry[]): void
    (e: 'update:return', vars: ReturnEntry[]): void
    (e: 'update:conditions', conds: ConditionEntry[]): void
    (e: 'update:loop', value: LoopEntry[]): void
}>()

const handleVariableUpdate = (vars: VariableEntry[]) => {
    console.log("Variables mises à jour :", vars)
    emit('update:variables', vars)
}

const handleReturnUpdate = (ret: ReturnEntry[]) => {
    console.log("Retour mises à jour :", ret)
    emit('update:return', ret)
}

const handleConditionsUpdate = (conds: ConditionEntry[]) => {
    console.log("Conditionss mises à jour :", conds)
    emit('update:conditions', conds)
}

const handleUpdateLoop = (loop: LoopEntry[]) => {
    console.log("Boucle mises à jour :", loop)
    emit('update:loop', loop)
}


const dialogStates = ref<boolean[]>(LogicButton.map(() => false))

function openDialog(index: number) {
    dialogStates.value[index] = true
}
function closeDialog(index: number) {
    dialogStates.value[index] = false
}
</script>

<template>
    <div>
        <div v-for="(btn, index) in LogicButton" :key="index" class="btn">
            <LogicButtonRuleEditor :label="btn.label" :type="btn.type" :variant="btn.variant" :under="btn.under"
                @click="openDialog(index)" />

            <v-dialog v-model="dialogStates[index]" max-width="500">
                <v-card :title="btn.label">
                    <v-card-text>
                        <LogicFormRuleEditor :type="btn.type" @update:variables="handleVariableUpdate"
                            @update:conditions="handleConditionsUpdate" @update:loop="handleUpdateLoop"
                            @update:return="handleReturnUpdate" />
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
.btn {
    display: grid;
}
</style>
