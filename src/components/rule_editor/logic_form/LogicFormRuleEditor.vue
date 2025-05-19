<script lang="ts" setup>
import { ConditionEntry, LoopEntry, ReturnEntry, VariableEntry } from '@/utils/type';
import { defineProps } from 'vue';
import LogicFormVariableRuleEditor from './LogicFormVariableRuleEditor.vue';

const props = defineProps<{
    type: string,
    selectedOperand?: string,
    defaultOperand?: string
}>()

watch(
    () => props.defaultOperand,
    (newVal) => {
        console.log('defaultOperand changed:', newVal)
    },
    { immediate: true }
)


const emit = defineEmits<{
    (e: 'update:variables', value: VariableEntry[]): void
    (e: 'update:return', value: ReturnEntry[]): void
    (e: 'update:conditions', value: ConditionEntry[]): void
    (e: 'update:loop', value: LoopEntry[]): void
}>()

const localVariables = ref<VariableEntry>({
    name: '',
    type: '',
    operation: '',
    operand: []
})

const localReturn = ref<ReturnEntry>({
    name: '',
    type: '',
})

const localConditions = ref<ConditionEntry>({
    right: '',
    left: '',
    operation: '',
})

const localLoop = ref<LoopEntry>({
    collectionsName: '',
    collectionsType: '',
    collectionsValues: [],
    loopVariable: '',
    loopVariableType: ''
})

watch(
    () => props.selectedOperand,
    (newVal) => {
        if (newVal) {
            localVariables.value.operand = [newVal]
        }
    },
    { immediate: true }
)

const handleUpdateVariables = (vars: VariableEntry[]) => {
    localVariables.value = vars[0] || { name: '', type: '', operation: '', operand: [] }
    emit('update:variables', vars)
    console.log(localVariables.value);

}

const handleUpdateReturn = (ret: ReturnEntry[]) => {
    localReturn.value = ret[0] || { name: '', type: '' }
    emit('update:return', ret)
    console.log(localReturn.value);

}

const handleUpdateConditions = (conds: ConditionEntry[]) => {
    localConditions.value = conds[0] || { right: '', left: '', operation: '' }
    emit('update:conditions', conds)
    console.log(localConditions.value);
}

const handleUpdateLoop = (loop: LoopEntry[]) => {
    localLoop.value = loop[0] || {
        collectionsName: '',
        collectionsType: '',
        collectionsValues: [],
        loopVariable: '',
        loopVariableType: ''
    }
    emit('update:loop', loop)
    console.log(localLoop.value);
}

</script>

<template>
    <div>
        <div v-if="type === 'variable'">
            <LogicFormVariableRuleEditor @update:variables="handleUpdateVariables" :defaultOperand="defaultOperand" />
        </div>

        <div v-else-if="type === 'condition'">
            <LogicFormConditionRuleEditor @update:conditions="handleUpdateConditions" />
        </div>

        <div v-else-if="type === 'then'">
            <LogicFormVariableRuleEditor @update:variables="handleUpdateVariables" />
        </div>

        <div v-else-if="type === 'else'">
            <LogicFormVariableRuleEditor @update:variables="handleUpdateVariables" />
        </div>

        <div v-else-if="type === 'operation'">
            <LogicFormVariableRuleEditor @update:variables="handleUpdateVariables" :initialOperand="selectedOperand" />
        </div>

        <div v-else-if="type === 'loop'">
            <LogicFormLoopRuleEditor @update:loop="handleUpdateLoop" />
        </div>

        <div v-else-if="type === 'continue'">
            <LogicFormConditionRuleEditor @update:conditions="handleUpdateConditions" />
        </div>

        <div v-else-if="type === 'break'">
            <LogicFormConditionRuleEditor @update:conditions="handleUpdateConditions" />
        </div>

        <div v-else-if="type === 'return'">
            <LogicFormReturnRuleEditor @update:return="handleUpdateReturn" />
        </div>

        <div v-else>
            <p>Formulaire non disponible.</p>
        </div>
    </div>
</template>
