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

// 💡 Exemple de structure JSON : nœuds et liaisons
const nodes = ref<Node[]>([
  {
    id: '1',
    type: 'input',
    label: 'Entrée: capital',
    position: { x: 50, y: 50 },
    data: { label: 'Variable: capital' },
  },
  {
    id: '2',
    type: 'default',
    label: 'Assign: prime_brute = capital * taux',
    position: { x: 250, y: 50 },
    data: { label: 'Assign: prime_brute = capital * taux' },
  },
  {
    id: '3',
    type: 'default',
    label: 'Condition: age > 60 ?',
    position: { x: 450, y: 50 },
    data: { label: 'Condition: age > 60 ?' },
  },
  {
    id: '4',
    type: 'output',
    label: 'Return: prime_totale',
    position: { x: 650, y: 50 },
    data: { label: 'Return: prime_totale' },
  }
])

const edges = ref<Edge[]>([
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' }
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
