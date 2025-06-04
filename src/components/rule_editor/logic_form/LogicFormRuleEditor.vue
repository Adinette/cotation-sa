<script lang="ts" setup>
import { defineProps, onMounted, ref } from 'vue'
import LogicFormConditionRuleEditor from './LogicFormConditionRuleEditor.vue'
import LogicFormLoopRuleEditor from './LogicFormLoopRuleEditor.vue'
import LogicFormReturnRuleEditor from './LogicFormReturnRuleEditor.vue'
import LogicFormVariableRuleEditor from './LogicFormVariableRuleEditor.vue'

import type { ConditionEntry, EditorType, LoopEntry, ReturnEntry, VariableEntry } from '@/utils/type'

// Refs
const showEditorModal = ref(false)
const selectedNode = ref<{ label: string, nodeId: string } | null>(null)
// Props
const props = defineProps<{
    type: EditorType,
    defaultOperand?: string,
    label?: string,
    nodeId?: string,
    index: number,
    isSecondaryEditor?: boolean,
    onClose: (index: number) => void,
    onSubmitVariable?: (data: VariableEntry) => void,
    onSubmitCondition?: (data: ConditionEntry) => void,
    onSubmitLoop?: (data: LoopEntry) => void,
    onSubmitReturn?: (data: ReturnEntry) => void
}>()

// Emits
const emit = defineEmits<{
    (e: 'update:variables', value: VariableEntry[]): void
    (e: 'update:return', value: ReturnEntry[]): void
    (e: 'update:conditions', value: ConditionEntry[]): void
    (e: 'update:loop', value: LoopEntry[]): void
}>()

// Local values (optionally set or reset)
const localState = {
    variable: ref<VariableEntry>({ name: '', operation: '' }),
    return: ref<ReturnEntry>({ name: '' }),
    condition: ref<ConditionEntry>({ right: '', left: '', operation: '' }),
    loop: ref<LoopEntry>({ loopVariable: '', tableName: '' }),
}

// Mapping for dynamic components
const editorComponents = {
    variable: LogicFormVariableRuleEditor,
    operation: LogicFormVariableRuleEditor,
    condition: LogicFormConditionRuleEditor,
    loop: LogicFormLoopRuleEditor,
    continue: LogicFormConditionRuleEditor,
    break: LogicFormConditionRuleEditor,
    return: LogicFormReturnRuleEditor,
}

// Mapping of update handlers
const updateHandlers = {
    variable: (val: VariableEntry[]) => {
        localState.variable.value = val[0] || { name: '', operation: '' }
        emit('update:variables', val)
    },
    operation: (val: VariableEntry[]) => {
        localState.variable.value = val[0] || { name: '', operation: '' }
        emit('update:variables', val)
    },
    return: (val: ReturnEntry[]) => {
        localState.return.value = val[0] || { name: '' }
        emit('update:return', val)
    },
    condition: (val: ConditionEntry[]) => {
        localState.condition.value = val[0] || { right: '', left: '', operation: '' }
        emit('update:conditions', val)
    },
    loop: (val: LoopEntry[]) => {
        localState.loop.value = val[0] || { tableName: '', loopVariable: '' }
        emit('update:loop', val)
    },
    continue: (val: ConditionEntry[]) => {
        localState.condition.value = val[0] || { right: '', left: '', operation: '' }
        emit('update:conditions', val)
    },
    break: (val: ConditionEntry[]) => {
        localState.condition.value = val[0] || { right: '', left: '', operation: '' }
        emit('update:conditions', val)
    },
}

// Submit handlers (optionnels si tu veux les centraliser)
const submitHandlers = {
    variable: (data: VariableEntry) =>
        handleVariableSubmit(data, (submitted) => updateHandlers.variable([submitted])),

    operation: (data: VariableEntry) =>
        handleVariableSubmit(data, (submitted) => updateHandlers.operation([submitted])),

    return: (data: ReturnEntry) =>
        handleReturnSubmit(data, (submitted) => updateHandlers.return([submitted])),

    condition: (data: ConditionEntry) =>
        handleConditionSubmit(data, (submitted) => updateHandlers.condition([submitted])),

    loop: (data: LoopEntry) =>
        handleLoopSubmit(data, (submitted) => updateHandlers.loop([submitted])),

    continue: (data: ConditionEntry) =>
        handleConditionSubmit(data, (submitted) => updateHandlers.condition([submitted])),

    break: (data: ConditionEntry) =>
        handleConditionSubmit(data, (submitted) => updateHandlers.condition([submitted])),
}

// Events listener pour l’éditeur secondaire
onMounted(() => {
    window.addEventListener('open-variable-editor', (event: any) => {
        const { label, nodeId } = event.detail || {}
        if (label && nodeId) {
            selectedNode.value = { label, nodeId }
            showEditorModal.value = true
        }
    })
})
</script>

<template>
    <div v-if="editorComponents[type]">
        <!-- Editeur principal -->
        <component v-if="!isSecondaryEditor" :is="editorComponents[type]" :index="index" :label="label" :nodeId="nodeId"
            :defaultOperand="defaultOperand" :defaultConditions="localState.condition.value"
            :defaultLoop="localState.loop.value" :closeDialog="onClose" :onSubmit="submitHandlers[type]"
            @update:variables="updateHandlers.variable" @update:conditions="updateHandlers.condition"
            @update:return="updateHandlers.return" @update:loop="updateHandlers.loop" />

        <!-- Editeur secondaire (modal) -->
        <component v-if="isSecondaryEditor && showEditorModal && selectedNode" :is="editorComponents[type]"
            :index="index" :label="selectedNode.label" :nodeId="selectedNode.nodeId" :closeDialog="onClose"
            :onSubmit="submitHandlers[type]" @close="showEditorModal = false" @submit="(newLabel: any) => {
                // Met à jour le label dans les nodes si nécessaire
                const node = nodes?.find(n => n.id === selectedNode?.nodeId)
                if (node) node.data.label = newLabel
                showEditorModal = false
            }" @update:variables="updateHandlers.variable" @update:conditions="updateHandlers.condition"
            @update:return="updateHandlers.return" @update:loop="updateHandlers.loop" />
    </div>

    <div v-else>
        <p>Formulaire non disponible.</p>
    </div>
</template>
