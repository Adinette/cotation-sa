import { BreakNode, ConditionDefinitionVueFlowNode, ContinueNode, ElseNode, EndConditionNode, ThenNode } from '@/class/ConditionDefinitionVueFlowNode';
import type { ConditionEntry } from '@/utils/type';
import type { Edge, Node } from '@vue-flow/core';

function insertConditionBetween(
    newConditionNode: Node,
    endNewConditionNodeId: string,
    parentBranchId: string,
    inferredEndConditionNodeId: string,
    edges: Ref<Edge[]>,
    loopNodePairs?: { loopNodeId: string; endId: string }[],
) {
    // Supprimer l’arête directe parent → end
    const edgeIndex = edges.value.findIndex(
        e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
    );
    if (edgeIndex !== -1) {
        edges.value.splice(edgeIndex, 1);
    }

    if (selectedButton.value?.type === 'break' || selectedButton.value?.type === 'continue') {
        const edgeIndex = edges.value.findIndex(
            e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
        );
        if (edgeIndex !== -1) {
            edges.value.splice(edgeIndex, 1);
        }
    } else {
        edges.value.push(
            { id: `e-${parentBranchId}-${newConditionNode.id}`, source: parentBranchId, target: newConditionNode.id, },
            { id: `e-${endNewConditionNodeId}-${inferredEndConditionNodeId}`, source: endNewConditionNodeId, target: inferredEndConditionNodeId, }
        );
    }
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

const selectedBranchNodeId = ref<string | null>(null);

function handleClick(clickedId: string, type: 'Then' | 'Else') {
    selectedBranchNodeId.value = clickedId;

    console.log(`Nœud cliqué : ${type} (${clickedId})`);
}


function createBranchNodes(conditionId: string, x: number, y: number, branchNode?: string) {
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
    brancheNode?: string
): { nodes: Node[]; edges: Edge[] } {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    conditionEntries.forEach((condition, index) => {
        const conditionId = `cond-${condition.left}-${index}`;
        if (existingNodes.some(n => n.id === conditionId)) return;

        const parentNode = existingNodes.find(n => n.id === parentBranchId);
        const { baseX, baseY } = getBasePosition(parentNode);

        const conditionNode = createConditionNode(condition, conditionId, baseX, baseY);
        const { thenNode, elseNode, endNode } = createBranchNodes(conditionId, baseX, baseY, brancheNode);
        console.log(brancheNode, 'branchNode');

        allNodes.push(conditionNode, thenNode, elseNode, endNode);
        existingNodes.push(conditionNode, thenNode, elseNode, endNode);

        allEdges.push(...createBranchEdges(conditionId, thenNode, elseNode, endNode));

        if (loopNodePairs && edgesRef) {
            console.log("ok");

            loopNodePairs.forEach(({ loopNodeId, endId }) => {
                console.log(loopNodeId, endId, "loopNodePairs");
                console.log("oui");


                const newEdges = edgesRef.value.filter(e => !(e.source === loopNodeId && e.target === endId));
                newEdges.push(
                    { id: `e-${loopNodeId}-${conditionId}`, source: loopNodeId!, target: conditionId! },
                    { id: `e-${endNode.id}-${endId}`, source: endNode.id!, target: endId! }
                );
                edgesRef.value = newEdges; // force la réactivité

                console.log("Arêtes temporaires :", edgesRef.value);

                if (selectedButton.value?.type === 'continue') {
                    const continueNode = createContinueNode(conditionId, baseX, baseY);
                    allNodes.push(continueNode);
                    existingNodes.push(continueNode);
                    removeEdge(edgesRef, endNode.id, endId);
                    allEdges.push(
                        { id: `e-${endNode.id}-${continueNode.id}`, source: endNode.id, target: continueNode.id },
                        { id: `e-${continueNode.id}-${endId}`, source: continueNode.id, target: endId },
                        { id: `e-${endId}-${inferredEndConditionNodeId}`, source: endId, target: inferredEndConditionNodeId! }

                    );
                    // removeEdge(edgesRef, endId, conditionId!);
                    // removeEdge(edgesRef, endNode.id, inferredEndConditionNodeId!);
                }

                if (selectedButton.value?.type === 'break') {
                    const breakNode = createBreakNode(conditionId, baseX, baseY);
                    allNodes.push(breakNode);
                    existingNodes.push(breakNode);
                    removeEdge(edgesRef, endNode.id, endId);
                    allEdges.push(
                        { id: `e-${endNode.id}-${breakNode.id}`, source: endNode.id, target: breakNode.id },
                        { id: `e-${breakNode.id}-${endId}`, source: breakNode.id, target: endId },
                        { id: `e-${endId}-${inferredEndConditionNodeId}`, source: endId, target: inferredEndConditionNodeId! }

                    );
                }
            });

        }
        if (inferredEndConditionNodeId && edgesRef) {

            const lastConnectedNode = edgesRef.value.findLast(
                e => e.target === inferredEndConditionNodeId
            )?.source;
            const dynamicParentId = lastConnectedNode ?? parentBranchId;
            insertConditionBetween(conditionNode, endNode.id, dynamicParentId!, inferredEndConditionNodeId, edgesRef, loopNodePairs);
        }
    });

    return { nodes: allNodes, edges: allEdges };
}
