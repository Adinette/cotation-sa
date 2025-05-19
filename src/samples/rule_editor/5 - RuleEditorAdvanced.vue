// 📁 RuleEditor.vue
<script lang="ts" setup>

// 📦 IMPORTS
import LogicModalRuleEditor from '@/components/rule_editor/LogicModalRuleEditor.vue'
import { BlocType, ConditionEntry, LoopEntry, ReturnEntry, VariableEntry } from '@/utils/type'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/controls/dist/style.css'
import { Edge, Node, VueFlow, useVueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/minimap/dist/style.css'
import { ref, watch } from 'vue'

// 🔗 VUE FLOW SETUP
const { onConnect, addEdges } = useVueFlow()
onConnect(addEdges)

// 📊 REACTIVE STATE
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const selectedNode = ref<Node | null>(null)
const showSidebar = ref(false)
const formVariables = ref<VariableEntry[]>([])
const formReturn = ref<ReturnEntry[]>([])
const testValues = ref({ age: 35, capital: 100000, taux: 0.015, frais_fixes: 5000 })
const formConditions = ref<ConditionEntry[]>([])
const formLoop = ref<LoopEntry[]>([])

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

// 🔁 WATCH VARIABLES

watch(formVariables, (newVal) => {

  for (const v of newVal) {
    // générer le nodeId à partir de v
    const mainVar = `${v?.name} = ${v?.operand[0]} ${v?.operation} ${v?.operand[1]}`;

    const nodeId = `var-${mainVar}`

    const exists = nodes.value.some(n => n.id === nodeId)
    if (exists) continue

    nodes.value.push(
      {
        id: nodeId,
        type: 'define_variable',
        position: { x: 100, y: 100 },
        style: { backgroundColor: 'rgba(16, 185, 129, 0.5)', width: '250px', height: '150px', padding: '16px' },
        data: {
          label: 'Déclaration de variable'
        }
      },
      {
        id: `${nodeId}-child`,
        position: { x: 10, y: 50 },
        parentNode: nodeId,
        extent: 'parent',
        data: {
          label: mainVar,
          type: BlocType.DEFINE_VARIABLE
        }
      }
    );
  }
}, { deep: true });

// 🔁 WATCH RETURN

watch(formReturn, (newRet) => {

  for (const v of newRet) {
    // générer le nodeId à partir de v
    const mainRet = `${v.name}`
    const nodeId = `var-${mainRet}`

    const exists = nodes.value.some(n => n.id === nodeId)
    if (exists) continue

    nodes.value.push({

      id: nodeId,
      type: 'return',
      position: { x: 100, y: 100 },
      style: { backgroundColor: '#fff', width: '100px', height: '100', padding: '16px' },
      data: {
        label: 'Retour'
      }
    },
      {
        id: `${nodeId}-child`,
        position: { x: 10, y: 50 },
        parentNode: nodeId,
        extent: 'parent',
        data: {
          label: `${mainRet}`,
          type: BlocType.RETURN
        }

      })
  }
}, { deep: true });


// 🔁 WATCH CONDITIONS

watch(formConditions, (newCond) => {

  for (const v of newCond) {
    // générer le nodeId à partir de v
    const mainCond = `${v.left} ${v.operation} ${v.right}`
    const nodeId = `var-${mainCond}`

    const exists = nodes.value.some(n => n.id === nodeId)
    if (exists) continue

    nodes.value.push({

      id: nodeId,
      type: 'condition',
      position: { x: 100, y: 100 },
      style: { backgroundColor: 'rgba(139, 92, 246, 0.5)', width: '200px', height: '150px', padding: '16px' },
      data: {
        label: 'Condition'
      }
    },
      {
        id: `${nodeId}-child`,
        position: { x: 10, y: 50 },
        parentNode: nodeId,
        extent: 'parent',
        data: {
          label: `${mainCond}`,
          type: BlocType.CONDITION
        }

      })
  }
}, { deep: true });

// WATCH LOOP
watch(formLoop, (newLoop) => {

  for (const v of newLoop) {
    // générer le nodeId à partir de v
    const mainLoop = `Variable collections: ${v?.collectionsName} = [${v?.collectionsValues.join(', ')}]`
    const nodeId = `var-${mainLoop}`

    const exists = nodes.value.some(n => n.id === nodeId)
    if (exists) continue

    nodes.value.push({
      id: nodeId,
      type: 'loop',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `${mainLoop}`,
        type: BlocType.LOOP
      }
    })
  }

}, { deep: true });

// ▶️ SIMULATION
function simulateExecution() {
  const context: Record<string, any> = { ...testValues.value }

  for (const v of formVariables.value) {
    if (v.name && v.operation === 'const') {
      context[v.name] = v.type === 'number' ? Number(v.type) : v.type
    }
  }

  const sortedNodes = [...nodes.value].sort((a, b) => {
    const aIndex = edges.value.findIndex(e => e.target === a.id)
    const bIndex = edges.value.findIndex(e => e.target === b.id)
    return aIndex - bIndex
  })

  try {
    for (const node of sortedNodes) {
      const { type, data } = node
      if (!data) continue

      switch (type) {
        case BlocType.DEFINE_VARIABLE: {
          const { expression, name } = data
          context[name] = expression.operation === '*'
            ? context[expression.operands[0]] * context[expression.operands[1]]
            : context[expression.operands[0]] + context[expression.operands[1]]
          break
        }
        case BlocType.OPERATION: {
          const { expression, assignTo } = data
          context[assignTo] = expression.operation === '*'
            ? context[expression.operands[0]] * expression.operands[1]
            : context[expression.operands[0]] + expression.operands[1]
          break
        }
        case BlocType.CONDITION: {
          const test = data.test
          const condition = eval(`${context[test.left]} ${test.operator} ${test.right}`)
          if (condition && data.then) {
            for (const inner of data.then) {
              const innerExpr = inner.expression
              context[inner.assignTo] = innerExpr.operation === '*'
                ? context[innerExpr.operands[0]] * innerExpr.operands[1]
                : 0
            }
          }
          break
        }
      }
    }

    console.table(context)
    alert("Simulation terminée. Résultat dans la console.")
  } catch (e: any) {
    alert("Erreur lors de la simulation : " + e.message)
    console.error(e)
  }
}
</script>


<template>
  <div class="flex h-screen">

    <div class="w-1/5 bg-white border-l flex flex-col">
      <div class="p-4">
        <h2 class="text-xl font-bold">Éditeur de règles graphique</h2>
        <LogicFormEnterVariableRuleEditor />
      </div>

      <div class="bloc">
        <div class="bloc-button">
          <h2 class="text-lg font-bold mb-2">Logique</h2>
          <LogicModalRuleEditor @update:variables="formVariables = $event" @update:conditions="formConditions = $event"
            @update:loop="formLoop = $event" @update:return="formReturn = $event" />
        </div>

        <div class="bloc-editor">
          <h2 class="text-lg font-bold mb-2">Editeur</h2>
          <VueFlow :nodes="nodes" :edges="edges" :fit-view="true">
            <Background />
            <Controls />
            <MiniMap />
          </VueFlow>
        </div>
      </div>
      <button @click="simulateExecution" class="mt-4 bg-purple-600 text-white px-4 py-1 rounded">
        ▶️ Simuler règle
      </button>
    </div>
    <button @click="exportJSON" class="absolute bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
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
