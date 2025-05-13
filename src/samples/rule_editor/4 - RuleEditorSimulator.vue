// 📁 RuleEditor.vue
<script lang="ts" setup>
import { ref, defineAsyncComponent, h } from 'vue'
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

// 📦 Noeuds dynamiques (exemple minimal pour démarrer)
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

// 📝 Formulaire temporaire pour édition
const selectedNode = ref<Node | null>(null)
const showSidebar = ref(false)

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

function exportJSON() {
  const rule = {
    nodes: nodes.value.map(n => ({ id: n.id, type: n.type, data: n.data })),
    edges: edges.value.map(e => ({ source: e.source, target: e.target }))
  }
  console.log('🧾 Rule JSON:', JSON.stringify(rule, null, 2))
  alert("Règle exportée dans la console")
}

// 🎯 Simulation avec valeurs factices
const testValues = ref({
  age: 35,
  capital: 100000,
  taux: 0.015,
  frais_fixes: 5000
})

function simulateExecution() {
  alert("Simulation exécutée (fonctionnalité à connecter au moteur Python)")
  console.table(testValues.value)
}
</script>

<template>
  <div class="flex h-screen">
    <!-- 🎛️ Éditeur graphique -->
    <div class="w-4/5 h-full">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :fit-view="true"
        @connect="onConnect"
        @node-click="openNodeForm"
      />
    </div>

    <!-- 🧾 Panneau latéral -->
    <div class="w-1/5 bg-white border-l flex flex-col">
      <div class="p-4 border-b">
        <h2 class="text-lg font-bold mb-2">Édition du bloc</h2>
        <div v-if="selectedNode">
          <label class="block text-sm mb-1">Type</label>
          <div class="mb-2">{{ selectedNode.type }}</div>
          <label class="block text-sm mb-1">Label</label>
          <input v-model="selectedNode.data.label" class="w-full border p-1 mb-2" />
          <button @click="saveNodeEdits" class="mt-2 bg-blue-600 text-white px-4 py-1 rounded">
            Enregistrer
          </button>
        </div>
      </div>

      <div class="p-4">
        <h3 class="text-sm font-semibold">💡 Valeurs de test</h3>
        <label class="block text-xs mt-2">Âge</label>
        <input type="number" v-model="testValues.age" class="w-full border p-1 mb-2" />
        <label class="block text-xs">Capital</label>
        <input type="number" v-model="testValues.capital" class="w-full border p-1 mb-2" />
        <label class="block text-xs">Taux</label>
        <input type="number" v-model="testValues.taux" class="w-full border p-1 mb-2" />
        <label class="block text-xs">Frais fixes</label>
        <input type="number" v-model="testValues.frais_fixes" class="w-full border p-1 mb-2" />
        <button @click="simulateExecution" class="mt-4 bg-purple-600 text-white px-4 py-1 rounded">
          ▶️ Simuler règle
        </button>
      </div>
    </div>

    <!-- 🔘 Actions -->
    <button
      @click="exportJSON"
      class="absolute bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg"
    >
      Exporter JSON
    </button>
  </div>
</template>

<style scoped>
input {
  border-radius: 4px;
}
</style>
