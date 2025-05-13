// 📁 RuleEditor.vue
<script lang="ts" setup>
import { ref, defineAsyncComponent } from 'vue'
import {
  VueFlow,
  useVueFlow,
  Node,
  Edge
} from '@vue-flow/core'

import '@vue-flow/core/dist/style.css'

const { onConnect } = useVueFlow()

// 🔢 BlocType enum
enum BlocType {
  INPUT_VARIABLE = "input_variable",
  DEFINE_VARIABLE = "define_variable",
  CONDITION = "condition",
  OPERATION = "operation",
  LOOP = "loop",
  CONTINUE = "continue",
  BREAK = "break",
  FUNCTION_CALL = "function_call",
}

// 🎛️ Exemple de blocs personnalisés
const input_variable = {
  id: "var1",
  type: BlocType.INPUT_VARIABLE,
  data: {
    name: "capital",
    label: "Capital assuré",
    source: "formulaire",
    dataType: "number"
  },
  position: { x: 50, y: 50 },
}

const define_variable = {
  id: "var2",
  type: BlocType.DEFINE_VARIABLE,
  data: {
    name: "prime_brute",
    expression: {
      operation: "*",
      operands: ["capital", "taux"]
    }
  },
  position: { x: 250, y: 50 },
}

const condition = {
  id: "cond1",
  type: BlocType.CONDITION,
  data: {
    test: {
      left: "age",
      operator: ">",
      right: 60
    },
    then: [
      {
        type: BlocType.OPERATION,
        expression: {
          operation: "*",
          operands: ["prime_brute", 1.2]
        },
        assignTo: "prime_brute"
      }
    ],
    else: []
  },
  position: { x: 450, y: 50 },
}

const operation = {
  id: "op1",
  type: BlocType.OPERATION,
  data: {
    expression: {
      operation: "+",
      operands: ["prime_brute", "frais_fixes"]
    },
    assignTo: "prime_totale"
  },
  position: { x: 650, y: 50 },
}

const loop = {
  id: "loop1",
  type: BlocType.LOOP,
  data: {
    loopVariable: "garantie",
    collection: "garanties_supplementaires",
    body: [
      {
        type: BlocType.DEFINE_VARIABLE,
        name: "prime_garantie",
        expression: {
          operation: "*",
          operands: ["garantie.capital", "garantie.taux"]
        }
      },
      {
        type: BlocType.OPERATION,
        expression: {
          operation: "+",
          operands: ["prime_total_temp", "prime_garantie"]
        },
        assignTo: "prime_total_temp"
      }
    ]
  },
  position: { x: 850, y: 50 },
}

const loop_continue = {
  id: "loop_continue1",
  type: BlocType.CONTINUE,
  data: {
    test: {
      left: "garantie",
      operator: "==",
      right: "suicide"
    }
  },
  position: { x: 1050, y: 50 },
}

const loop_break = {
  id: "loop_break1",
  type: BlocType.BREAK,
  data: {
    condition: {
      left: "garantie.capital",
      operator: "<=",
      right: 0
    }
  },
  position: { x: 1250, y: 50 },
}

const function_call = {
  id: "func1",
  type: BlocType.FUNCTION_CALL,
  data: {
    name: "sort",
    args: [
      { type: "variable", value: "garanties" },
      { type: "string", value: "capital" },
      { type: "string", value: "desc" }
    ],
    assignTo: "garanties_triees"
  },
  position: { x: 1450, y: 50 },
}

const nodes = ref<Node[]>([input_variable, define_variable, condition, operation, loop, loop_continue, loop_break, function_call])

const edges = ref<Edge[]>([
  { id: 'e1-2', source: 'var1', target: 'var2' },
  { id: 'e2-3', source: 'var2', target: 'cond1' },
  { id: 'e3-4', source: 'cond1', target: 'op1' },
])
</script>

<template>
  <div class="w-full h-screen">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :fit-view="true"
      @connect="onConnect"
    />
  </div>
</template>

<style scoped>
/* Optional styling */
</style>
