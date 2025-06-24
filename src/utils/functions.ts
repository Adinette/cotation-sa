import { useNodesStore } from '@/stores/nodesStore';
import { Edge } from '@vue-flow/core';

const edges = ref<Edge[]>([])

export const selectedParentId = ref<string>('');

export function tryAddEdge(sourceId: string, targetId: string) {
    const store = useNodesStore()

    const canSource = store.canAddEdge(sourceId, 1)
    const canTarget = store.canAddEdge(targetId, 1)

    if (canSource && canTarget) {
        const newEdge = {
            id: `e-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
        }

        edges.value.push(newEdge)

        store.incrementEdgeCount(sourceId)
        store.incrementEdgeCount(targetId)
    }
}
