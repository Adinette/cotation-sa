// store/nodesStore.ts
import type { Node } from '@vue-flow/core'
import { defineStore } from 'pinia'

export const useNodesStore = defineStore('nodes', {
    state: () => ({
        createdNodes: [] as Node[],
        edgeCountByNodeId: {} as Record<string, number>,
    }),

    actions: {
        addNode(node: Node) {
            this.createdNodes.push(node)
            this.edgeCountByNodeId[node.id] = 0
        },

        incrementEdgeCount(nodeId: string) {
            if (this.edgeCountByNodeId[nodeId] !== undefined) {
                this.edgeCountByNodeId[nodeId]++
            }
        },

        getEdgeCount(nodeId: string): number {
            return this.edgeCountByNodeId[nodeId] ?? 0
        },

        canAddEdge(nodeId: string, maxEdges: number): boolean {
            return this.getEdgeCount(nodeId) < maxEdges
        },
    },
})
