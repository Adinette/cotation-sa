<script lang="ts" setup>
import { EditorType, LogicButtonType, VariableEntry, VariantType } from '@/utils/type';
import { onMounted, ref } from 'vue';
import LogicFormRuleEditor from './logic_form/LogicFormRuleEditor.vue';

const props = defineProps<{
    label?: string,
    nodeId?: string,
    isSecondary?: boolean,
    onSubmit?: (data: VariableEntry) => void
    btnType: Array<{ label: string; variant: VariantType; type: EditorType; under?: boolean }>,
    buttons: Array<{ label: string; variant: VariantType; type: EditorType; under?: boolean }>,
}>();

const emit = defineEmits<{
    (e: 'update:selectedButton', btn: LogicButtonType): void
}>();


const selectedButton = ref<LogicButtonType | null>(null);
const isSecondaryEditor = ref(false);
const selectedVariableNode = ref<{ label: string; nodeId: string } | null>(null);
const showEditorModal = ref(false);
const dialogStates = ref<boolean[]>(props.buttons.map(() => false));

onMounted(() => {
    window.addEventListener('open-variable-editor', (event: any) => {
        const { label, nodeId } = event.detail || {};
        if (label && nodeId) {
            selectedVariableNode.value = { label, nodeId };
            showEditorModal.value = true;
        }
    });
});

function openDialog(index: number) {
    const btn = props.buttons[index];
    selectedButton.value = btn;
    dialogStates.value[index] = true;
    emit('update:selectedButton', btn);
}

function closeDialog(index: number) {
    dialogStates.value[index] = false;
}
const handleVariables = handleVariablesUpdate(emit, formVariables);
const handleConditions = handleConditionsUpdate(emit, formReturn);
const handleReturns = handleReturnUpdate(emit, formConditions);
const handleLoops = handleLoopUpdate(emit, formLoop);

function getCommonEditorProps(index: number) {
    return {
        label: props.label,
        nodeId: props.nodeId,
        onClose: () => closeDialog(index),
        isSecondaryEditor: isSecondaryEditor.value,
    };
}

</script>

<template>
    <div>
        <div v-for="(btn, index) in props.buttons" :key="index" class="btn">
            <LogicButtonRuleEditor :label="btn.label" :type="btn.type" :variant="btn.variant" :under="btn.under"
                @click="() => openDialog(index)" :disabled="['continue', 'break'].includes(btn.type) && !isLoopValid" />
            <LogicDialog v-model="dialogStates[index]" :title="btn.label" :index="index"
                @close="() => closeDialog(index)">
                <LogicFormRuleEditor :type="btn.type" :index="index" v-bind="getCommonEditorProps(index)"
                    @update:variables="handleVariables" @update:conditions="handleConditions" @update:loop="handleLoops"
                    @update:return="handleReturns" :onSubmitVariable="handleVariableSubmit"
                    :onSubmitCondition="handleConditionSubmit" :onSubmitLoop="handleLoopSubmit"
                    :onSubmitReturn="handleReturnSubmit" />
            </LogicDialog>
        </div>
    </div>
</template>

<style scoped>
.btn {
    display: grid;
}
</style>
