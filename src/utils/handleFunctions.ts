import { ref } from 'vue';
import type { ConditionEntry, LoopEntry, ReturnEntry, VariableEntry } from './type';


// const hasCondition = ref(false);
export const isLoopValid = ref(false);
export const formVariables = ref<VariableEntry[]>([])
export const formReturn = ref<ReturnEntry[]>([])
export const formConditions = ref<ConditionEntry[]>([])
export const formLoop = ref<LoopEntry[]>([])
export const submittedData = ref<VariableEntry | ConditionEntry | LoopEntry | ReturnEntry | null>(null);


export const handleVariablesUpdate = (emit: any, formVariables: any) => (variables: VariableEntry[]) => {
    formVariables.value = variables;
    emit('update:variables', variables);
    emit('update:close');
    console.log('variables reçues :', variables);
};

export const handleConditionsUpdate = (emit: any, formConditions: any) => (conditions: ConditionEntry[]) => {
    formConditions.value = conditions;
    //  hasCondition.value = conds.length > 0;
    emit('update:conditions', conditions);
    emit('update:close');
    console.log('conditions reçues :', conditions);
};
export const handleReturnUpdate = (emit: any, formReturn: any) => (returns: ReturnEntry[]) => {
    formReturn.value = returns
    emit('update:returns', returns);
    emit('update:close');
    console.log('Return reçues :', returns)
};
export const handleLoopUpdate = (emit: any, formLoop: any) => (loop: LoopEntry[]) => {

    formLoop.value = loop
    emit('update:loop', loop);
    emit('update:close');
    console.log('Boucle reçues :', loop)
    isLoopValid.value = !!(
        loop?.[0]?.loopVariable &&
        loop?.[0]?.tableName
    );
};

export function handleVariableSubmit(data: VariableEntry, onSubmitVariable?: (data: VariableEntry) => void) {
    submittedData.value = data;
    onSubmitVariable?.(data);
    console.log("Donnée soumise variable:", data);
}

export function handleReturnSubmit(data: ReturnEntry, onSubmitReturn?: (data: ReturnEntry) => void) {
    submittedData.value = data;
    onSubmitReturn?.(data);
    console.log("Donnée soumise retourner:", data);
}

export function handleConditionSubmit(data: ConditionEntry, onSubmitCondition?: (data: ConditionEntry) => void) {
    submittedData.value = data;
    onSubmitCondition?.(data);
    console.log("Donnée soumise Condition:", data);
}

export function handleLoopSubmit(data: LoopEntry, onSubmitLoop?: (data: LoopEntry) => void) {
    submittedData.value = data;
    onSubmitLoop?.(data);
    console.log("Donnée soumise boucle:", data);
}

export function handleConditionClick(nodeId: string, label = 'Then') {
    selectedParentId.value = nodeId;

    console.log(`✅ ${label.toUpperCase()} cliqué, parent ID :`, nodeId);
    console.log(`condition imbriquée, parent ${label} ID =`, selectedParentId.value);

    window.dispatchEvent(
        new CustomEvent('open-variable-editor', {
            detail: {
                nodeId,
                label,
                isParent: true
            }
        })
    );
}
