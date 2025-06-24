// 📁 RuleEditor.vue
<script lang="ts" setup>

// 📦 IMPORTS
import LogicModalRuleEditor from '@/components/rule_editor/LogicModalRuleEditor.vue'
import { tryAddEdge } from '@/utils/functions'
import { ConditionEntry, LogicButton, LogicButtonType, LoopEntry, ReturnEntry, VariableEntry } from '@/utils/type'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/controls/dist/style.css'
import { Edge, Node, NodeMouseEvent, VueFlow, useVueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/minimap/dist/style.css'
import { ref } from 'vue'

// 📊 REACTIVE STATE
const props = defineProps<{
  index: number
  onClose: (index: number) => void
}>()
const edges = ref<Edge[]>([])
const nodes = ref<Node[]>([])
const selectedNode = ref<Node | null>(null)
const showSidebar = ref(false)
const formVariables = ref<VariableEntry[]>([])
const formReturn = ref<ReturnEntry[]>([])
const formConditions = ref<ConditionEntry[]>([])
const formLoop = ref<LoopEntry[]>([])
const btnTypeValue = LogicButton
const currentMeta = ref({ label: '', nodeId: '' })
const selectedNextNodeId = ref<string | null>(null)
const currentLoopNodePairs = ref<{ loopNodeId: string; endId: string }[]>([]);


// 🔗 VUE FLOW SETUP
const { onConnect } = useVueFlow()

onConnect(({ source, target }) => {
  tryAddEdge(source, target)
})
// 🔁 HANDLERS

function handleNodeClick({ node }: NodeMouseEvent) {
  if (node?.data?.onClick && typeof node.data.onClick === 'function') {
    node.data.onClick()
  }
}

function onSelectedButtonUpdate(btn: LogicButtonType) {
  selectedButton.value = btn
  console.log(btn, "btn");
}

function onMetaUpdate(payload: { label: string; nodeId: string }) {
  currentMeta.value = payload
}
onMounted(() => {
  window.addEventListener('open-variable-editor', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { nodeId, inferredEndConditionNodeId } = customEvent.detail;
    selectedParentId.value = nodeId;
    selectedNextNodeId.value = inferredEndConditionNodeId;
  });
});

function onSubmitVariableOrOperation(data: VariableEntry) {
  const type = selectedButton.value?.type ?? 'variable';
  onVariablesUpdate(
    data,
    type,
    nodes,
    edges,
    formVariables,
    selectedNextNodeId.value,
    selectedParentId.value,
    currentLoopNodePairs.value
  );
}

async function onConditionUpdate(newConditions: ConditionEntry[]) {

  const { nodes: newNodes, edges: newEdges } = generateConditionNodes(
    newConditions,
    nodes.value,
    selectedParentId.value ?? undefined,
    selectedNextNodeId.value ?? undefined,
    edges,
    currentLoopNodePairs.value,

  )
  nodes.value.push(...newNodes);
  nodes.value = [...nodes.value];
  await nextTick();
  edges.value.push(...newEdges);
  edges.value = [...edges.value];

  formConditions.value.push(...newConditions)
}


function onReturnsUpdate(newReturn: ReturnEntry[]) {
  const lastNode = nodes.value[nodes.value.length - 1];
  const { nodes: newNodes, edges: newEdges } = generateReturnNodes(newReturn, nodes.value, selectedNextNodeId.value ?? undefined,
    lastNode?.id, edges, currentLoopNodePairs.value)
  nodes.value.push(...newNodes)
  edges.value.push(...newEdges)
  formReturn.value.push(...newReturn)
  console.log(nodes.value);

}

async function onLoopUpdate(newLoop: LoopEntry[], btn: LogicButtonType) {
  const { nodes: newNodes, edges: newEdges, loopNodePairs } = generateLoopNodes(
    newLoop,
    nodes.value,
    selectedParentId.value ?? undefined,
    selectedNextNodeId.value ?? undefined,
    edges
  );

  if (newNodes.length > 0) {
    nodes.value.push(...newNodes);
    nodes.value = [...nodes.value];
    edges.value.push(...newEdges);
    edges.value = [...edges.value];
    formLoop.value.push(...newLoop);
    await nextTick();
  }

  if (loopNodePairs.length > 0) {
    currentLoopNodePairs.value = loopNodePairs;
  }
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
}
</script>

<template>
  <div class="flex h-screen">
    <div class="w-1/5 bg-white border-l flex flex-col">
      <div class="p-4">
        <h2 class="text-xl font-bold">Éditeur de règles graphique</h2>
        <LogicFormEnterVariableRuleEditor @update:variables="onSubmitVariableOrOperation" />
      </div>

      <div class="bloc">
        <div class="bloc-button">
          <h2 class="text-lg font-bold mb-2">Logique</h2>
          <LogicModalRuleEditor @update:variables="onSubmitVariableOrOperation" @update:conditions="onConditionUpdate"
            @update:loop="onLoopUpdate" @update:returns="onReturnsUpdate" :btnType="btnTypeValue"
            :buttons="btnTypeValue" @update:selectedButton="onSelectedButtonUpdate" />
        </div>

        <div class="bloc-editor">
          <h2 class="text-lg font-bold mb-2">Editeur</h2>

          <VueFlow @nodeClick="handleNodeClick" v-model:nodes="nodes" v-model:edges="edges" :fit-view-on-init="true"
            :default-zoom="1" class="vue-flow">
            <Background />
            <Controls />
            <MiniMap />
            <LogicFormEditNode :onClose="onClose" @update:variables="onSubmitVariableOrOperation"
              @update:selectedButton="onSelectedButtonUpdate" @update:conditions="onConditionUpdate"
              @update:returns="onReturnsUpdate" @update:loop="onLoopUpdate" @update:meta="onMetaUpdate"
              :onSubmitVariable="handleVariableSubmit" :onSubmitCondition="handleConditionSubmit"
              :onSubmitLoop="handleLoopSubmit" :onSubmitReturn="handleReturnSubmit" :key="selectedParentId"
              :conditionType="selectedParentId" />
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

.vue-flow__handle-bottom {
  background-color: black;
  border-radius: 50%;
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
