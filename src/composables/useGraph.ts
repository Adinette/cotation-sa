import { ref } from 'vue';

export type Expression = {
  operation: string;
  operands: (string | number)[];
}

export interface Node {
  id: string;
  type: string;
  data: any;
}

export const nodes = ref<Node[]>([])

export function addNode(node: Node) {
  nodes.value.push(node)
}
