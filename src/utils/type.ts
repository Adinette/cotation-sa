
export type VariantType = 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
export type EditorType = 'variable' | 'operation' | 'condition' | 'loop' | 'return' | 'continue' | 'break'
export type LogicButtonType = {
  label: string
  variant: VariantType
  type: EditorType
  under?: boolean
}

export enum BlocType {
  INPUT_VARIABLE = "input_variable",
  DEFINE_VARIABLE = "define_variable",
  CONDITION = "condition",
  THEN = "then",
  ELSE = "else",
  OPERATION = "operation",
  LOOP = "loop",
  CONTINUE = "continue",
  BREAK = "break",
  RETURN = "return",
  FUNCTION_CALL = "function_call",
}

export interface FieldConfig {
  name: string
  label: string
  type: 'select' | 'textarea' | 'text'
  multiple?: boolean
  options?: string[]
  dynamicOptions?: boolean
}

export interface VariableEntry {
  name: string
  operation: string
}

export interface ReturnEntry {
  name: string
}


export interface ConditionEntry {
  left: string
  right: string
  operation: string
}

export interface LoopEntry {
  tableName: string,
  loopVariable: string,
}

export const LogicButton: LogicButtonType[] = [
  { label: 'Variable', variant: 'tonal', type: "variable" },
  { label: 'Condition', variant: 'tonal', type: "condition" },
  { label: 'Opération', variant: 'tonal', type: "operation" },
  { label: 'Boucle', variant: 'tonal', type: "loop" },
  { label: 'Passer', variant: 'outlined', type: "continue", under: true },
  { label: 'Arreter', variant: 'outlined', type: "break", under: true },
  { label: 'Retour', variant: 'tonal', type: "return" }
]

export const enterVariables = ref([
  { label: "Âge de l'assuré", key: "age" },
  { label: "Capital de l'assuré", key: "capital" },
  { label: "Taux", key: "taux" },
  { label: "Frais fixes", key: "frais_fixes" }
]);

export const comparisonOperations = ref([
  '==', '!=', '>', '<', '>=', '<='
])

export const baseItems = ['frais_fixe', 'capital', 'taux', 'age']
