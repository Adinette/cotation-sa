<script lang="ts" setup>
import { LogicButton, LogicButtonType } from '@/utils/type';
import { onMounted, ref } from 'vue';
import LogicModalRuleEditor from '../LogicModalRuleEditor.vue';

const btnTypeValue = LogicButton
const isLoopValid = ref(false);
const showEditorModal = ref(false)
const selectedVariableNode = ref<{ label: string, nodeId: string } | null>(null)
const dialogStates = ref<boolean[]>(LogicButton.map(() => false))
const selectedThenParentId = ref<string | null>(null)
const selectedButton = ref<LogicButtonType | null>(null)

const props = defineProps<{
    conditionType: string
}>();


const emit = defineEmits<{
    (e: 'update:meta', payload: { label: string, nodeId: string }): void;
    (e: 'update:selectedButton', btn: LogicButtonType): void;
}>();

const handleVariables = handleVariablesUpdate(emit, formVariables);
const handleConditions = handleConditionsUpdate(emit, formReturn);
const handleReturns = handleReturnUpdate(emit, formConditions);
const handleLoops = handleLoopUpdate(emit, formLoop);

function onSelectedButtonUpdate(btn: LogicButtonType) {
    selectedButton.value = btn
    emit('update:selectedButton', btn)
}

function closeDialog(index: number) {
    dialogStates.value = [...dialogStates.value.slice(0, index), false, ...dialogStates.value.slice(index + 1)]
    if (index === 0) {
        showEditorModal.value = false
        selectedVariableNode.value = null
    }
}

onMounted(() => {
    window.addEventListener('open-variable-editor', (event: any) => {
        const { label, nodeId, isParent } = event.detail || {}

        if (isParent) {
            selectedThenParentId.value = nodeId
        }

        if (label && nodeId) {
            selectedVariableNode.value = { label, nodeId }
            showEditorModal.value = true
            dialogStates.value[0] = true
            emit('update:meta', { label, nodeId })
        }
    })
})

const filteredButtons = computed(() => {

    if (!props.conditionType) return LogicButton;

    if (props.conditionType.includes('then')) {
        return LogicButton.filter(btn =>
            ['Variable', 'Opération', 'Retour'].includes(btn.label)
        );
    }
    if (props.conditionType.includes('else')) {
        return LogicButton.filter(btn =>
            ['Variable', 'Condition', 'Opération', 'Boucle', 'Passer', 'Arreter', 'Retour'].includes(btn.label)
        );
    }

    return LogicButton;
});
</script>

<template>
    <div>
        <div v-for="(btn, index) in filteredButtons" :key="index" class="btn">
            <LogicDialogNested v-model="dialogStates[index]" title="Ajouter un bloc" @close="closeDialog(index)"
                :disabled="['continue', 'break'].includes(btn.type) && !isLoopValid">
                <template #default="{ openNestedDialog }">
                    <LogicModalRuleEditor v-if="showEditorModal && selectedVariableNode"
                        :label="selectedVariableNode.label" :nodeId="selectedVariableNode.nodeId"
                        :btnType="btnTypeValue" :buttons="filteredButtons" @update:variables="handleVariables"
                        @update:conditions="handleConditions" @update:loop="handleLoops" @update:returns="handleReturns"
                        @update:selectedButton="onSelectedButtonUpdate" :onSubmitVariable="handleVariableSubmit"
                        :onSubmitCondition="handleConditionSubmit" :onSubmitLoop="handleLoopSubmit"
                        :onSubmitReturn="handleReturnSubmit" @close="dialogStates[0] = false" />
                </template>
            </LogicDialogNested>
        </div>
    </div>
</template>

<style scoped>
.btn {
    display: grid;
}
</style>
