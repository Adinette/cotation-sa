import { ReturnDefinitionVueFlowNode } from '@/class/ReturnDefinitionVueFlowNode';
import type { ReturnEntry } from '@/utils/type';
import type { Edge, Node } from '@vue-flow/core';

function insertReturnBetween(
    newReturnNode: Node,
    parentBranchId: string,
    inferredEndConditionNodeId: string,
    edges: Ref<Edge[]>
) {
    const edgeIndex = edges.value.findIndex(
        e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
    );
    if (edgeIndex !== -1) edges.value.splice(edgeIndex, 1);

    edges.value.push(
        { id: `e-${parentBranchId}-${newReturnNode.id}`, source: parentBranchId, target: newReturnNode.id },
        { id: `e-${newReturnNode.id}-${inferredEndConditionNodeId}`, source: newReturnNode.id, target: inferredEndConditionNodeId }
    );
}

function createReturnNode(entry: ReturnEntry, index: number): Node {
    const returnId = `ret-${entry.name}`;
    return new ReturnDefinitionVueFlowNode({
        id: returnId,
        type: 'return',
        position: { x: 300, y: 100 + index * 500 },
        data: { label: `Retour: ${entry.name}`, name: entry.name },
        connectable: true,
    }).node;
}

function updateLoopEdges(
    edges: Ref<Edge[]>,
    returnNode: Node,
    loopNodePairs: { loopNodeId: string; endId: string }[],
    inferredEndConditionNodeId: string
) {
    const { loopNodeId, endId } = loopNodePairs[loopNodePairs.length - 1];

    const edgeIndex = edges.value.findIndex(e => e.source === loopNodeId && e.target === endId);
    if (edgeIndex !== -1) edges.value.splice(edgeIndex, 1);

    edges.value.push(
        { id: `e-${loopNodeId}-${returnNode.id}`, source: loopNodeId, target: returnNode.id },
        { id: `e-${returnNode.id}-${endId}`, source: returnNode.id, target: endId },
        { id: `e-${endId}-${inferredEndConditionNodeId}`, source: endId, target: inferredEndConditionNodeId }
    );

    edges.value = edges.value.filter(e => !e.source.startsWith('ret-') || !e.target.startsWith('end-cond'));
    edges.value = edges.value.filter(e => !e.source.startsWith('end-loop-') || !e.target.startsWith('ret'));
}

export function generateReturnNodes(
    returnEntries: ReturnEntry[],
    existingNodes: Node[] = [],
    inferredEndConditionNodeId?: string,
    parentBranchId?: string,
    edgesRef?: Ref<Edge[]>,
    loopNodePairs?: { loopNodeId: string; endId: string }[]
): { nodes: Node[]; edges: Edge[] } {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    returnEntries.forEach((entry, index) => {
        const returnId = `ret-${entry.name}`;
        if (existingNodes.some(n => n.id === returnId)) return;

        const returnNode = createReturnNode(entry, index);
        existingNodes.push(returnNode);
        allNodes.push(returnNode);

        const lastEdge = edgesRef?.value.at(-1);
        const lastTarget = lastEdge?.target;

        if (lastTarget) {
            edgesRef?.value.push({
                id: `e-${lastTarget}-${returnNode.id}`,
                source: lastTarget,
                target: returnNode.id,
            });
        }

        if (parentBranchId && inferredEndConditionNodeId && edgesRef) {
            insertReturnBetween(returnNode, parentBranchId, inferredEndConditionNodeId, edgesRef);

            if (loopNodePairs?.length) {
                updateLoopEdges(edgesRef, returnNode, loopNodePairs, inferredEndConditionNodeId);
            }
            edgesRef.value = edgesRef.value.filter(e => !e.source.startsWith('end-cond'));
        }
        if (loopNodePairs && edgesRef && !(parentBranchId && inferredEndConditionNodeId)) {
            loopNodePairs.forEach(({ endId }) => {
                const edgeToEnd = edgesRef.value.find(e =>
                    e.target === endId &&
                    (e.source.startsWith('var-') || e.source.startsWith('op-') || e.source.startsWith('loop-'))
                );
                const previousNodeId = edgeToEnd?.source;

                if (previousNodeId) {
                    const edgeIndex = edgesRef.value.findIndex(e => e.source === previousNodeId && e.target === endId);
                    if (edgeIndex !== -1) edgesRef.value.splice(edgeIndex, 1);

                    edgesRef.value.push(
                        { id: `e-${previousNodeId}-${returnNode.id}`, source: previousNodeId, target: returnNode.id },
                        { id: `e-${returnNode.id}-${endId}`, source: returnNode.id, target: endId }
                    );
                }
            });
        }
    });

    return { nodes: allNodes, edges: allEdges };
}
