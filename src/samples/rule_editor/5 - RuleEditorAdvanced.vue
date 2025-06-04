// 📁 RuleEditor.vue
<script lang="ts" setup>

// 📦 IMPORTS
import LogicModalRuleEditor from '@/components/rule_editor/LogicModalRuleEditor.vue'
import { ConditionEntry, LogicButton, LogicButtonType, LoopEntry, ReturnEntry, VariableEntry } from '@/utils/type'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/controls/dist/style.css'
import { Edge, Node, NodeMouseEvent, VueFlow, useVueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/minimap/dist/style.css'
import { ref, watch } from 'vue'


// 🔗 VUE FLOW SETUP
const { onConnect, addEdges } = useVueFlow()
onConnect(addEdges)

// 📊 REACTIVE STATE
const props = defineProps<{
  index: number
  onClose: (index: number) => void
}>()

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const selectedNode = ref<Node | null>(null)
const showSidebar = ref(false)
const formVariables = ref<VariableEntry[]>([])
const formReturn = ref<ReturnEntry[]>([])
const formConditions = ref<ConditionEntry[]>([])
const formLoop = ref<LoopEntry[]>([])
const btnTypeValue = LogicButton
const selectedConditionParentId = ref<string | null>(null)
const selectedButton = ref<LogicButtonType | null>(null)
const currentMeta = ref({ label: '', nodeId: '' })

// 🔁 HANDLERS
function handleNodeClick({ node }: NodeMouseEvent) {
  if (node?.data?.onClick && typeof node.data.onClick === 'function') {
    node.data.onClick()
  }
}

function onVariablesUpdate(newVariables: VariableEntry | VariableEntry[]) {
  formVariables.value = Array.isArray(newVariables) ? newVariables : [newVariables]
}

function onConditionUpdate(newCond: ConditionEntry[]) {
  formConditions.value = newCond
  console.log(newCond, 'Conditions reçues dans RuleEditor')
}

function onReturnsUpdate(newRet: ReturnEntry[]) {
  formReturn.value = newRet
  console.log(newRet, 'Retour reçues dans RuleEditor')
}

function onLoopUpdate(newLoop: LoopEntry[]) {
  formLoop.value = newLoop
  console.log(newLoop, 'boucle reçues dans RuleEditor')
}

function onSelectedButtonUpdate(btn: LogicButtonType) {
  selectedButton.value = btn
  console.log('⚡ Event reçu dans ruleEditr:', btn.type)
}

function onMetaUpdate(payload: { label: string; nodeId: string }) {
  currentMeta.value = payload
  console.log(payload, 'payload')
}

// 🎛️ SIDEBAR HANDLING
function openNodeForm(node: Node) {
  selectedNode.value = node
  showSidebar.value = true
}

function saveNodeEdits() {
  const index = nodes.value.findIndex(n => n.id === selectedNode.value?.id)
  if (index !== -1 && selectedNode.value) {
    nodes.value[index] = { ...selectedNode.value }
  }
  showSidebar.value = false
}

// 📤 EXPORT
function exportJSON() {
  const rule = {
    nodes: nodes.value.map(n => ({ id: n.id, type: n.type, data: n.data })),
    edges: edges.value.map(e => ({ source: e.source, target: e.target }))
  }
  console.log('🧾 Rule JSON:', JSON.stringify(rule, null, 2))
  alert("Règle exportée dans la console")
}

function generateNodes() {
  const btnType = selectedButton.value?.type || ''

  if (!submittedData.value && currentMeta.value.label === 'Then') {
    console.log('⏸️ Donnée soumise manquante. `generateConditionNode` ignoré.', submittedData.value)
    return
  }

  const variablesArray = Array.isArray(formVariables.value) ? formVariables.value : [formVariables.value]

  formConditions.value.forEach((condition, i) => {
    generateConditionNode(
      condition,
      variablesArray[i] ?? {},
      formReturn.value[i],
      formLoop.value[i],
      nodes.value,
      variablesArray,
      btnType
    )
  })

  if (formConditions.value.length === 0 && formVariables.value.length > 0) {
    formVariables.value.forEach((v) => generateVariableNode(v, nodes.value, btnType))
  }

  if (formReturn.value.length > 0 && !selectedParentId.value) {
    formReturn.value.forEach((v) => generateReturnNodes(v, nodes.value))
  }

  if (formLoop.value.length > 0 && !selectedParentId.value) {
    formLoop.value.forEach((v) => generateLoopNodes(v, nodes.value))
  }

  selectedConditionParentId.value = null
  submittedData.value = null
}

// 📡 WATCHERS
watch(
  [formConditions, formVariables, formReturn, formLoop, selectedConditionParentId, selectedButton],
  generateNodes,
  { deep: true }
)

</script>

<template>
  <div class="flex h-screen">
    <div class="w-1/5 bg-white border-l flex flex-col">
      <div class="p-4">
        <h2 class="text-xl font-bold">Éditeur de règles graphique</h2>
        <LogicFormEnterVariableRuleEditor @update:variables="onVariablesUpdate" />
      </div>

      <div class="bloc">
        <div class="bloc-button">
          <h2 class="text-lg font-bold mb-2">Logique</h2>
          <LogicModalRuleEditor @update:variables="onVariablesUpdate" @update:conditions="onConditionUpdate"
            @update:loop="onLoopUpdate" @update:returns="onReturnsUpdate" :btnType="btnTypeValue"
            :buttons="btnTypeValue" @update:selectedButton="onSelectedButtonUpdate" />
        </div>

        <div class="bloc-editor">
          <h2 class="text-lg font-bold mb-2">Editeur</h2>

          <VueFlow @nodeClick="handleNodeClick" v-model:nodes="nodes" v-model:edges="edges">
            <Background />
            <Controls />
            <MiniMap />
            <LogicFormEditNode :onClose="onClose" @update:variables="onVariablesUpdate"
              @update:selectedButton="onSelectedButtonUpdate" @update:conditions="onConditionUpdate"
              @update:returns="onReturnsUpdate" @update:loop="onLoopUpdate" @update:meta="onMetaUpdate"
              :onSubmitVariable="handleVariableSubmit" :onSubmitCondition="handleConditionSubmit"
              :onSubmitLoop="handleLoopSubmit" :onSubmitReturn="handleReturnSubmit" />
          </VueFlow>
        </div>
      </div>
    </div>

    <button @click="exportJSON" class="absolute bottom-4 right-4 bg-green-600 text-black px-4 py-2 rounded shadow-lg">
      Exporter JSON
    </button>
  </div>
</template>

<style scoped>
input {
  border-radius: 4px;
}

.bloc-button {
  display: grid;
  width: 16rem;
}

.bloc {
  display: flex;
}

.bloc-editor {
  width: 100%;
}
</style>

<!-- 
// const testValues = ref({ age: 35, capital: 100000, taux: 0.015, frais_fixes: 5000 })
// ▶️ SIMULATION
// function simulateExecution() {
//   const context: Record<string, any> = { ...testValues.value }

//   for (const v of formVariables.value) {
//     if (v.name && v.operation === 'const') {
//       context[v.name] = v.type === 'number' ? Number(v.type) : v.type
//     }
//   }

//   const sortedNodes = [...nodes.value].sort((a, b) => {
//     const aIndex = edges.value.findIndex(e => e.target === a.id)
//     const bIndex = edges.value.findIndex(e => e.target === b.id)
//     return aIndex - bIndex
//   })

//   try {
//     for (const node of sortedNodes) {
//       const { type, data } = node
//       if (!data) continue

//       switch (type) {
//         case BlocType.DEFINE_VARIABLE: {
//           const { expression, name } = data
//           context[name] = expression.operation === '*'
//             ? context[expression.operands[0]] * context[expression.operands[1]]
//             : context[expression.operands[0]] + context[expression.operands[1]]
//           break
//         }
//         case BlocType.OPERATION: {
//           const { expression, assignTo } = data
//           context[assignTo] = expression.operation === '*'
//             ? context[expression.operands[0]] * expression.operands[1]
//             : context[expression.operands[0]] + expression.operands[1]
//           break
//         }
//         case BlocType.CONDITION: {
//           const test = data.test
//           const condition = eval(`${context[test.left]} ${test.operator} ${test.right}`)
//           if (condition && data.then) {
//             for (const inner of data.then) {
//               const innerExpr = inner.expression
//               context[inner.assignTo] = innerExpr.operation === '*'
//                 ? context[innerExpr.operands[0]] * innerExpr.operands[1]
//                 : 0
//             }
//           }
//           break
//         }
//       }
//     }

//     console.table(context)
//     alert("Simulation terminée. Résultat dans la console.")
//   } catch (e: any) {
//     alert("Erreur lors de la simulation : " + e.message)
//     console.error(e)
//   }
// } -->
