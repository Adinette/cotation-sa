// type.ts

export type VariantType = 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
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

export interface VariableEntry  {
  name: string
  type: string
  operation: string
 operand: string[]; 
}

export interface ReturnEntry  {
  name: string
  type: string 
}


export interface ConditionEntry  {
  left: string
  right: string
  operation: string
}

export interface LoopEntry  {
  collectionsName: string,
  collectionsType: string,
  collectionsValues: string[],
  loopVariable: string,
  loopVariableType: string
}

export const LogicButton = [
    { label: 'Ajouter une variable', variant: 'tonal', type: "variable" },
    { label: 'Condition', variant: 'tonal', type: "condition" },
    { label: 'Then', variant: 'outlined', type: "then", under: true },
    { label: 'Else', variant: 'outlined', type: "else", under: true },
    { label: 'Opération', variant: 'tonal', type: "operation" },
    { label: 'Boucle', variant: 'tonal', type: "loop" },
    { label: 'Passer', variant: 'outlined', type: "continue", under: true },
    { label: 'Arreter', variant: 'outlined', type: "break", under: true },
    { label: 'Retour', variant: 'tonal', type: "return" }
]
