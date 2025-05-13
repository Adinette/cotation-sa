// 📁 RuleEditor.vue
<script lang="ts" setup>
import {
  Edge,
  Node,
  VueFlow,
  useVueFlow
} from '@vue-flow/core'
import { ref } from 'vue'

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

// 📦 Blocs de règles initiaux (avec formulaires internes)
const nodes = ref<Node[]>([]) // ⚠️ Voir ci-dessous : ces blocs seront ajoutés dynamiquement

const edges = ref<Edge[]>([])

// 📝 Formulaire temporaire pour édition de bloc
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
</script>

<template>
  <div class="flex h-screen">
    <!-- 👇 Editeur principal -->
    <div class="w-4/5 h-full">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :fit-view="true"
        @connect="onConnect"
        @node-click="openNodeForm"
      />
    </div>

    <!-- 🧾 Sidebar édition bloc -->
    <div v-if="showSidebar" class="w-1/5 bg-white p-4 border-l overflow-auto">
      <h2 class="text-lg font-bold mb-2">Édition du bloc</h2>
      <div v-if="selectedNode">
        <label class="block text-sm mb-1">Type</label>
        <div class="mb-2">{{ selectedNode.type }}</div>

        <label class="block text-sm mb-1">Label / Expression</label>
        <input v-model="selectedNode.data.label" class="w-full border p-1 mb-2" />

        <button @click="saveNodeEdits" class="mt-4 bg-blue-600 text-white px-4 py-1 rounded">
          Enregistrer
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
