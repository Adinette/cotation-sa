import { EndLoopNode, LoopDefinitionVueFlowNode } from '@/class/LoopDefinitionVueFlowNode';
import type { Edge, Node } from '@vue-flow/core';
import type { Ref } from 'vue';
import { LoopEntry } from './type';

function insertLoopBetween(
    newLoopNode: Node,
    endNewLoopNodeId: string,
    parentBranchId: string,
    inferredEndConditionNodeId: string,
    edges: Ref<Edge[]>
) {
    // Supprimer l’arête directe parent → end
    const edgeIndex = edges.value.findIndex(
        e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
    );
    if (edgeIndex !== -1) {
        edges.value.splice(edgeIndex, 1);
    }

    // Ajouter parent → nouvelle boucle
    edges.value.push({
        id: `e-${parentBranchId}-${newLoopNode.id}-${Date.now()}`,
        source: parentBranchId,
        target: newLoopNode.id,
    });
    console.log(edges.value);

    // Ajouter fin de nouvelle boucle → ancienne fin
    edges.value.push({
        id: `e-${endNewLoopNodeId}-${inferredEndConditionNodeId}-${Date.now()}`,
        source: endNewLoopNodeId,
        target: inferredEndConditionNodeId,
    });
    console.log(edges.value);

    // Mise à jour pour forcer le rendu
    edges.value = [...edges.value];
}

export function generateLoopNodes(
    loopEntries: LoopEntry[],
    existingNodes: Node[] = [],
    parentBranchId?: string,
    inferredEndConditionNodeId?: string,
    edgesRef?: Ref<Edge[]>
): { nodes: Node[]; edges: Edge[]; loopNodePairs: { loopNodeId: string; endId: string }[] } {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    const loopNodePairs: { loopNodeId: string; endId: string }[] = [];

    loopEntries.forEach((loop, index) => {
        const mainLoop = `${loop?.tableName}, ${loop?.loopVariable}`;
        const loopId = `loop-${loop.tableName}-${index}`;

        const alreadyExists = existingNodes.some(n => n.id === loopId);
        if (alreadyExists) return;
        // Positionnement
        const parentNode = existingNodes.find(n => n.id === parentBranchId);
        const baseX = parentNode?.position?.x ?? 300;
        const baseY = parentNode?.position?.y ?? 100;
        const spacingX = 250;
        const spacingY = 300;

        const loopNode = new LoopDefinitionVueFlowNode({
            id: loopId,
            type: 'loop',
            position: { x: baseX + spacingX, y: baseY + spacingY },
            data: { label: `Boucle: ${mainLoop}`, name: mainLoop },
            connectable: true,
        }).node;

        const endNode = new EndLoopNode(`end-${loopId}`, {
            x: loopNode.position.x,
            y: loopNode.position.y + 200,
        }).node;

        allNodes.push(loopNode, endNode);
        existingNodes.push(loopNode, endNode);

        if (edgesRef) {
            edgesRef.value.push({
                id: `e-${loopId}-${endNode.id}-${Date.now()}`,
                source: loopId,
                target: endNode.id,
            });
        }

        loopNodePairs.push({ loopNodeId: loopNode.id, endId: endNode.id });
        console.log(allNodes);
        console.log(edgesRef?.value);
        // Étape 1 : essayer de récupérer les premières arêtes boucle → fin
        const firstEdges = edgesRef?.value.filter(
            e => e.source.startsWith('loop-') && e.target.startsWith('end-loop-')
        ).slice(0, 2);

        let dynamicParentId: string | undefined;
        let targetEndId: string | undefined;

        if (firstEdges && firstEdges.length >= 2) {
            const firstEdge = firstEdges[0];
            dynamicParentId = firstEdge.source;
            targetEndId = firstEdge.target;
            console.log('Cas 1 - via firstEdges');
        } else {
            const lastConnectedNode = edgesRef?.value.findLast(
                e => e.target === inferredEndConditionNodeId
            )?.source;

            dynamicParentId = lastConnectedNode ?? parentBranchId;
            targetEndId = inferredEndConditionNodeId;
            console.log('Cas 2 - via fallback');
        }

        console.log('Parent dynamique :', dynamicParentId);
        console.log('Condition de fin :', targetEndId);

        // Insertion si les deux sont valides
        if (dynamicParentId && targetEndId && edgesRef) {
            insertLoopBetween(loopNode, endNode.id, dynamicParentId, targetEndId, edgesRef);
            console.log(edgesRef?.value)

        }
    });

    return { nodes: allNodes, edges: allEdges, loopNodePairs };
}
