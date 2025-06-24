import { BreakNode, ConditionDefinitionVueFlowNode, ContinueNode, ElseNode, EndConditionNode, ThenNode } from '@/class/ConditionDefinitionVueFlowNode';
import type { ConditionEntry } from '@/utils/type';
import type { Edge, Node } from '@vue-flow/core';

function insertConditionBetween(
    newConditionNode: Node,
    endNewConditionNodeId: string,
    parentBranchId: string,
    inferredEndConditionNodeId: string,
    edges: Ref<Edge[]>,
) {
    // Supprimer l’arête directe parent → end
    const edgeIndex = edges.value.findIndex(
        e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
    );
    if (edgeIndex !== -1) {
        edges.value.splice(edgeIndex, 1);
    }

    // Ajouter parent → condition
    edges.value.push({
        id: `e-${parentBranchId}-${newConditionNode.id}`,
        source: parentBranchId,
        target: newConditionNode.id,
    });
    if (selectedButton.value?.type === 'break' || selectedButton.value?.type === 'continue') {

        const edgeIndex = edges.value.findIndex(
            e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
        );
        if (edgeIndex !== -1) {
            edges.value.splice(edgeIndex, 1);
        }
    }
    edges.value.push({
        id: `e-${endNewConditionNodeId}-${inferredEndConditionNodeId}`,
        source: endNewConditionNodeId,
        target: inferredEndConditionNodeId,
    });

    edges.value = [...edges.value];
}

function getBasePosition(parentNode?: Node) {
    const offsetY = 200;
    return {
        baseX: parentNode?.position?.x ?? 300,
        baseY: (parentNode?.position?.y ?? 100) + offsetY
    };
}

function createConditionNode(condition: ConditionEntry, id: string, x: number, y: number): Node {
    const label = `${condition.left} ${condition.operation} ${condition.right}`;
    return new ConditionDefinitionVueFlowNode({
        id,
        type: 'condition',
        position: { x, y },
        data: { label: `Condition: ${label}`, name: label },
        connectable: true,
    }).node;
}

function createBranchNodes(conditionId: string, x: number, y: number) {
    const offsetY = 150;

    const thenNode = new ThenNode(`then-${conditionId}`, { x: x - 150, y: y + offsetY }).node;
    const elseNode = new ElseNode(`else-${conditionId}`, { x: x + 150, y: y + offsetY }).node;
    const endNode = new EndConditionNode(`end-${conditionId}`, { x, y: y + offsetY * 2 }).node;

    thenNode.data = {
        ...thenNode.data,
        label: thenNode.data?.label ?? 'Alors (Then)',
        onClick: () => handleConditionClick(thenNode.id, 'Then')
    };
    elseNode.data = {
        ...elseNode.data,
        label: elseNode.data?.label ?? 'Sinon (Else)',
        onClick: () => handleConditionClick(elseNode.id, 'Else')
    };

    return { thenNode, elseNode, endNode };
}


function createBranchEdges(conditionId: string, thenNode: Node, elseNode: Node, endNode: Node): Edge[] {
    return [
        { id: `e-${conditionId}-${thenNode.id}`, source: conditionId, target: thenNode.id },
        { id: `e-${conditionId}-${elseNode.id}`, source: conditionId, target: elseNode.id },
        { id: `e-${thenNode.id}-${endNode.id}`, source: thenNode.id, target: endNode.id },
        { id: `e-${elseNode.id}-${endNode.id}`, source: elseNode.id, target: endNode.id }
    ];
}

function updateLoopEdges(edgesRef: Ref<Edge[]>, loopNodeId: string, endId: string, conditionId: string, endNodeId: string) {
    const index = edgesRef.value.findIndex(e => e.source === loopNodeId && e.target === endId);
    if (index !== -1) edgesRef.value.splice(index, 1);
    edgesRef.value.push(
        { id: `e-${loopNodeId}-${conditionId}`, source: loopNodeId, target: conditionId },
        { id: `e-${endNodeId}-${endId}`, source: endNodeId, target: endId }
    );
}

function createContinueNode(conditionId: string, x: number, y: number): Node {
    return new ContinueNode(`continue-${conditionId}`, { x: x - 150, y: y + 150 }).node;
}

function createBreakNode(conditionId: string, x: number, y: number): Node {
    return new BreakNode(`break-${conditionId}`, { x: x + 150, y: y + 150 }).node;
}

function removeEdge(edgesRef: Ref<Edge[]>, source: string, target: string) {
    const index = edgesRef.value.findIndex(e => e.source === source && e.target === target);
    if (index !== -1) edgesRef.value.splice(index, 1);
}

export function generateConditionNodes(
    conditionEntries: ConditionEntry[],
    existingNodes: Node[] = [],
    parentBranchId?: string,
    inferredEndConditionNodeId?: string,
    edgesRef?: Ref<Edge[]>,
    loopNodePairs?: { loopNodeId: string; endId: string }[],
): { nodes: Node[]; edges: Edge[] } {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    conditionEntries.forEach((condition, index) => {
        const conditionId = `cond-${condition.left}-${index}`;
        if (existingNodes.some(n => n.id === conditionId)) return;

        const parentNode = existingNodes.find(n => n.id === parentBranchId);
        const { baseX, baseY } = getBasePosition(parentNode);

        const conditionNode = createConditionNode(condition, conditionId, baseX, baseY);
        const { thenNode, elseNode, endNode } = createBranchNodes(conditionId, baseX, baseY);

        allNodes.push(conditionNode, thenNode, elseNode, endNode);
        existingNodes.push(conditionNode, thenNode, elseNode, endNode);

        allEdges.push(...createBranchEdges(conditionId, thenNode, elseNode, endNode));

        if (loopNodePairs && edgesRef) {
            loopNodePairs.forEach(({ loopNodeId, endId }) => {
                updateLoopEdges(edgesRef, loopNodeId, endId, conditionNode.id, endNode.id);

                if (selectedButton.value?.type === 'continue') {
                    const continueNode = createContinueNode(conditionId, baseX, baseY);
                    allNodes.push(continueNode);
                    existingNodes.push(continueNode);
                    allEdges.push(
                        { id: `e-${endNode.id}-${continueNode.id}`, source: endNode.id, target: continueNode.id },
                        { id: `e-${continueNode.id}-${endId}`, source: continueNode.id, target: endId }
                    );
                }

                if (selectedButton.value?.type === 'break') {
                    const breakNode = createBreakNode(conditionId, baseX, baseY);
                    allNodes.push(breakNode);
                    existingNodes.push(breakNode);
                    removeEdge(edgesRef, endNode.id, endId);
                    allEdges.push(
                        { id: `e-${endNode.id}-${breakNode.id}`, source: endNode.id, target: breakNode.id },
                        { id: `e-${breakNode.id}-${endId}`, source: breakNode.id, target: endId }
                    );
                }
            });
        }

        if (inferredEndConditionNodeId && edgesRef) {
            const lastConnectedNode = edgesRef.value.findLast(
                e => e.target === inferredEndConditionNodeId
            )?.source;
            const dynamicParentId = lastConnectedNode ?? parentBranchId;
            insertConditionBetween(conditionNode, endNode.id, dynamicParentId, inferredEndConditionNodeId, edgesRef);
        }
    });

    return { nodes: allNodes, edges: allEdges };
}



// export function generateConditionNodes(
//     conditionEntries: ConditionEntry[],
//     existingNodes: Node[] = [],
//     parentBranchId?: string,
//     inferredEndConditionNodeId?: string,
//     edgesRef?: Ref<Edge[]>,
//     loopNodePairs?: { loopNodeId: string; endId: string }[],
// ): { nodes: Node[]; edges: Edge[] } {
//     const allNodes: Node[] = [];
//     const allEdges: Edge[] = [];

//     conditionEntries.forEach((condition, index) => {
//         const mainCond = `${condition.left} ${condition.operation} ${condition.right}`;
//         const conditionId = `cond-${condition.left}-${index}`;

//         const alreadyExists = existingNodes.some(n => n.id === conditionId);
//         if (alreadyExists) return;

//         const parentNode = existingNodes.find(n => n.id === parentBranchId);
//         const baseX = parentNode?.position?.x ?? 300;
//         const baseY = parentNode?.position?.y ?? 100;
//         const offsetY = 200;

//         const conditionNode = new ConditionDefinitionVueFlowNode({
//             id: conditionId,
//             type: 'condition',
//             position: { x: baseX, y: baseY + offsetY },
//             data: { label: `Condition: ${mainCond}`, name: mainCond },
//             connectable: true,
//         }).node;

//         const thenNode = new ThenNode(`then-${conditionId}`, { x: baseX - 150, y: baseY + offsetY + 150 }).node;
//         const elseNode = new ElseNode(`else-${conditionId}`, { x: baseX + 150, y: baseY + offsetY + 150 }).node;
//         const endNode = new EndConditionNode(`end-${conditionId}`, { x: baseX, y: baseY + offsetY + 300 }).node;

//         thenNode.data = {
//             ...thenNode.data,
//             label: thenNode.data?.label ?? 'Alors (Then)',
//             onClick: () => handleConditionClick(thenNode.id, 'Then')
//         };

//         elseNode.data = {
//             ...elseNode.data,
//             label: elseNode.data?.label ?? 'Sinon (Else)',
//             onClick: () => handleConditionClick(elseNode.id, 'Else')
//         };

//         allNodes.push(conditionNode, thenNode, elseNode, endNode);
//         existingNodes.push(conditionNode, thenNode, elseNode, endNode);

//         allEdges.push(
//             { id: `e-${conditionId}-${thenNode.id}`, source: conditionId, target: thenNode.id },
//             { id: `e-${conditionId}-${elseNode.id}`, source: conditionId, target: elseNode.id },
//             { id: `e-${thenNode.id}-${endNode.id}`, source: thenNode.id, target: endNode.id },
//             { id: `e-${elseNode.id}-${endNode.id}`, source: elseNode.id, target: endNode.id }
//         );
//         const lastEdge = allEdges[allEdges?.length - 1];
//         console.log(lastEdge);
//         const firstEndNode = lastEdge.target
//         console.log(firstEndNode);

//         if (loopNodePairs && edgesRef) {
//             loopNodePairs.forEach(({ loopNodeId, endId }) => {
//                 const edgeIndex = edgesRef.value.findIndex(
//                     e => e.source === loopNodeId && e.target === endId
//                 );
//                 if (edgeIndex !== -1) {
//                     edgesRef.value.splice(edgeIndex, 1);
//                 }

//                 // Ajouter une arête de loop → condition
//                 edgesRef.value.push({
//                     id: `e-${loopNodeId}-${conditionNode.id}`,
//                     source: loopNodeId,
//                     target: conditionNode.id,
//                 });

//                 // Ajouter une arête de endCondition → endId (pour reconnecter la suite)
//                 edgesRef.value.push({
//                     id: `e-${endNode.id}-${endId}`,
//                     source: endNode.id,
//                     target: endId,
//                 });

//                 console.log('Arêtes ajoutées (cas standard) :', edgesRef.value);

//                 console.log(edgesRef.value);

//                 if (selectedButton.value?.type === 'continue') {
//                     const continueNode = new ContinueNode(`continue-${conditionId}`, {
//                         x: baseX - 150,
//                         y: baseY + offsetY + 150,
//                     }).node;

//                     allNodes.push(continueNode);
//                     existingNodes.push(continueNode);


//                     // Arêtes : condition → continue et continue → endLoop
//                     console.log(endId);

//                     allEdges.push(
//                         { id: `e-${endNode.id}-${continueNode.id}`, source: endNode.id, target: continueNode.id },
//                         { id: `e-${continueNode.id}-${endId}`, source: continueNode.id, target: endId },
//                         // { id: `e-${endId}-${endNode.id}`, source: endId, target: endNode.id },

//                     );
//                     console.log(allEdges);
             

//                 }

//                 if (selectedButton.value?.type === 'break') {
//                     const breakNode = new BreakNode(`break-${conditionId}`, {
//                         x: baseX + 150,
//                         y: baseY + offsetY + 150,
//                     }).node;

//                     allNodes.push(breakNode);
//                     existingNodes.push(breakNode);
//                     const edgeToRemoveIndex = edgesRef.value.findIndex(
//                         e => e.source === endNode.id && e.target === endId
//                     );
//                     if (edgeToRemoveIndex !== -1) {
//                         edgesRef.value.splice(edgeToRemoveIndex, 1);
//                         console.log(`Arête supprimée : ${endNode.id} → ${endId}`);
//                     }
//                     // Arêtes : condition → break et break → endLoop
//                     allEdges.push(
//                         { id: `e-${endNode.id}-${breakNode.id}`, source: endNode.id, target: breakNode.id },
//                         { id: `e-${breakNode.id}-${endId}`, source: breakNode.id, target: endId }
//                     );
//                 }
//                 edgesRef.value = [...edgesRef.value];

//             });
//         }
//         console.log(inferredEndConditionNodeId, "inferredEndConditionNodeId");

//         const lastConnectedNode = edgesRef?.value.findLast(
//             e => e.target === inferredEndConditionNodeId
//         )?.source;
//         console.log(lastConnectedNode, "lastConnectedNode");

//         const dynamicParentId = lastConnectedNode ?? parentBranchId;
//         console.log(dynamicParentId, "parentId");
//         console.log(inferredEndConditionNodeId, "inferredEndId")

//         if (dynamicParentId && inferredEndConditionNodeId && edgesRef) {
//             insertConditionBetween(conditionNode, endNode.id, dynamicParentId, inferredEndConditionNodeId, edgesRef);
//         }
//         console.log(edgesRef?.value)

//     });

//     return { nodes: allNodes, edges: allEdges };
// }

