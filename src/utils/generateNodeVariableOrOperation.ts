import { VariableDefinitionVueFlowNode } from "@/class/VariableDefinitionVueFlowNode";
import { Edge, Node, Position, XYPosition } from "@vue-flow/core"; // Ajout de Position et XYPosition si nécessaire pour les types
import { Ref } from 'vue'; // Ajout de Ref si utilisé pour les types d'arguments
import { VariableEntry } from "./type";

// Helper function to find the predecessor node in a path
function findPredecessorNodeInPath(
    pathStartId: string,
    pathEndId: string,
    allEdges: Edge[]
): string {
    if (pathStartId === pathEndId) {
        // This case implies that the branch is defined by a single node,
        // which acts as both start and end for finding a predecessor *within* it.
        // This shouldn't typically happen if pathEndId is a distinct end marker.
        // However, if it does, pathStartId is the only candidate.
        console.log(`[findPredecessorNodeInPath] pathStartId (${pathStartId}) is the same as pathEndId (${pathEndId}). Returning pathStartId.`);
        return pathStartId;
    }

    const queue: Array<{ nodeId: string, path: string[] }> = [{ nodeId: pathStartId, path: [pathStartId] }];
    const visitedInBfs = new Set<string>([pathStartId]);
    let pathToTarget: string[] | null = null;

    console.log(`[findPredecessorNodeInPath] Starting BFS from ${pathStartId} to ${pathEndId}`);

    while (queue.length > 0) {
        const current = queue.shift()!;
        console.log(`[findPredecessorNodeInPath] BFS visiting: ${current.nodeId}, path: [${current.path.join(', ')}]`);

        const neighbors = allEdges.filter(edge => edge.source === current.nodeId);
        for (const edge of neighbors) {
            console.log(`[findPredecessorNodeInPath] Checking neighbor: ${edge.target} from ${current.nodeId}`);
            if (edge.target === pathEndId) {
                pathToTarget = [...current.path, edge.target];
                console.log(`[findPredecessorNodeInPath] Found path to target: [${pathToTarget.join(', ')}]`);
                queue.length = 0; // Stop BFS once the target is reached via an edge
                break;
            }

            if (!visitedInBfs.has(edge.target)) {
                visitedInBfs.add(edge.target);
                const newPath = [...current.path, edge.target];
                queue.push({ nodeId: edge.target, path: newPath });
            }
        }
    }

    if (pathToTarget && pathToTarget.length > 1) {
        const predecessor = pathToTarget[pathToTarget.length - 2];
        console.log(`[findPredecessorNodeInPath] Path found. Predecessor to ${pathEndId} is ${predecessor}`);
        return predecessor;
    }

    console.log(`[findPredecessorNodeInPath] No direct path found or path too short. Returning pathStartId: ${pathStartId}`);
    return pathStartId;
}

// Variables
function generateVariableNodes(variables: VariableEntry[], startIndex = 0): Node[] {
    return variables.map((variable, index) => {
        const mainVar = `${variable?.name ?? ''} = ${variable?.operation ?? ''}`;
        const nodeId = `var-${variable?.name ?? 'unknown'}-${startIndex + index}-${Date.now()}`;
        console.log(`[generateVariableNodes] Creating variable node: ${nodeId} - ${mainVar}`);
        const nodeData = {
            id: nodeId,
            position: { x: 100 + (startIndex + index) * 250, y: 200 },
            type: 'define_variable',
            data: {
                label: `Déclaration: ${mainVar}`, name: variable?.name ?? '',
            }, connectable: true,
        }
        const nodeInstance = new VariableDefinitionVueFlowNode(nodeData);
        return nodeInstance.node;
    });
}

function createOperationNode(vars: VariableEntry[]): Node {
    const namePart = vars.map(v => v?.name).join('_') || 'op';
    const opPart = vars.map(v => v?.operation).join('_') || 'unknownOp';
    const operationLabel = `Opération: ${vars.map(v => v?.name).join(' + ')} = ${vars.map(v => v?.operation).join(' + ')}`;
    const nodeId = `op-${namePart}-${opPart}-${Date.now()}`;
    console.log(`[createOperationNode] Creating operation node: ${nodeId} - ${operationLabel}`);
    return {
        id: nodeId,
        type: "operation",
        position: { x: 300, y: 300 },
        data: { label: operationLabel },
        connectable: true,
    };
}

function handleOperationUpdate(
    varsUsedByOperation: VariableEntry[],
    nodes: Ref<Node[]>,
    edges: Ref<Edge[]>,
    branchEndNodeId: string,
    branchStartNodeId?: string,
    loopNodePairs?: { loopNodeId: string; endId: string }[]
): void {
    const operationNode = createOperationNode(varsUsedByOperation);
    nodes.value.push(operationNode);
    console.log(`[handleOperationUpdate] Added operation node ${operationNode.id} to nodes list.`);

    if (branchStartNodeId && branchEndNodeId) {
        console.log(`[handleOperationUpdate] Inserting operation ${operationNode.id} in branch ${branchStartNodeId} -> ${branchEndNodeId}`);
        const insertionPredecessorId = findPredecessorNodeInPath(branchStartNodeId, branchEndNodeId, edges.value);
        console.log(`[handleOperationUpdate] Found predecessor: ${insertionPredecessorId} for operation ${operationNode.id}`);

        const edgeToRemoveIndex = edges.value.findIndex(
            e => e.source === insertionPredecessorId && e.target === branchEndNodeId
        );

        if (edgeToRemoveIndex !== -1) {
            console.log(`[handleOperationUpdate] Removing edge: ${edges.value[edgeToRemoveIndex].source} -> ${edges.value[edgeToRemoveIndex].target} (ID: ${edges.value[edgeToRemoveIndex].id})`);
            edges.value.splice(edgeToRemoveIndex, 1);
        } else {
             if (insertionPredecessorId === branchStartNodeId &&
                !edges.value.some(e => e.source === branchStartNodeId && e.target === branchEndNodeId)) {
                 console.warn(`[handleOperationUpdate] Branch from ${branchStartNodeId} to ${branchEndNodeId} seems already populated or path is broken. No direct edge removed.`);
            } else if (insertionPredecessorId !== branchStartNodeId){
                 console.warn(`[handleOperationUpdate] Edge from determined predecessor ${insertionPredecessorId} to ${branchEndNodeId} not found to remove.`);
            } else {
                 console.warn(`[handleOperationUpdate] No edge found from ${insertionPredecessorId} to ${branchEndNodeId} to remove (predecessor might be start and no direct edge).`);
            }
        }

        const edge1Id = `e-${insertionPredecessorId}-${operationNode.id}-${Date.now()}`;
        console.log(`[handleOperationUpdate] Adding edge: ${insertionPredecessorId} -> ${operationNode.id} (ID: ${edge1Id})`);
        edges.value.push({
            id: edge1Id,
            source: insertionPredecessorId,
            target: operationNode.id,
        });

        const edge2Id = `e-${operationNode.id}-${branchEndNodeId}-${Date.now()}`;
        console.log(`[handleOperationUpdate] Adding edge: ${operationNode.id} -> ${branchEndNodeId} (ID: ${edge2Id})`);
        edges.value.push({
            id: edge2Id,
            source: operationNode.id,
            target: branchEndNodeId,
        });

    } else {
        console.warn(`[handleOperationUpdate] Operation node "${operationNode.id}" added without clear branch context. Attempting to connect to last known node.`);
        const lastNodeOverallArray = nodes.value.filter(n => n.id !== operationNode.id && !n.id.startsWith("end-"));
        if (lastNodeOverallArray.length > 0) {
            const lastNodeOverall = lastNodeOverallArray[lastNodeOverallArray.length-1];
            const edgeFallbackId = `e-${lastNodeOverall.id}-${operationNode.id}-${Date.now()}`;
            console.log(`[handleOperationUpdate] Fallback, adding edge: ${lastNodeOverall.id} -> ${operationNode.id} (ID: ${edgeFallbackId})`);
            edges.value.push({
                id: edgeFallbackId,
                source: lastNodeOverall.id,
                target: operationNode.id,
            });
        } else {
            console.warn(`[handleOperationUpdate] No previous node found to connect to operation ${operationNode.id}.`);
        }
    }

    edges.value = [...edges.value];
}


export function onVariablesUpdate(
    newVariables: VariableEntry | VariableEntry[],
    type: 'variable' | 'operation',
    nodes: Ref<Node[]>,
    edges: Ref<Edge[]>,
    formVariables: Ref<VariableEntry[]>,
    currentBranchEndNodeId: string,
    currentBranchStartNodeId?: string,
    loopNodePairs?: { loopNodeId: string; endId: string }[],
): Node[] {
    const vars = Array.isArray(newVariables) ? newVariables : (newVariables ? [newVariables] : []);

    if (type === 'operation') {
        console.log(`[onVariablesUpdate] Received type 'operation', delegating to handleOperationUpdate.`);
        handleOperationUpdate(vars, nodes, edges, currentBranchEndNodeId, currentBranchStartNodeId, loopNodePairs);
        return [];
    }

    console.log(`[onVariablesUpdate] Received type 'variable'. Variables:`, newVariables);
    const newUniqueVars = vars.filter(v => v && v.name && !formVariables.value.some(existing => existing.name === v.name));
    if (newUniqueVars.length === 0) {
        console.log(`[onVariablesUpdate] No new unique variables to add.`);
        return [];
    }

    formVariables.value.push(...newUniqueVars);
    const currentNodesCount = nodes.value.length;
    const newNodes = generateVariableNodes(newUniqueVars, currentNodesCount);

    if (newNodes.length === 0) {
        console.warn(`[onVariablesUpdate] generateVariableNodes returned no nodes.`);
        return [];
    }
    nodes.value.push(...newNodes);
    console.log(`[onVariablesUpdate] Added ${newNodes.length} variable nodes to main list. New node IDs: ${newNodes.map(n => n.id).join(', ')}`);


    if (currentBranchStartNodeId && currentBranchEndNodeId) {
        console.log(`[onVariablesUpdate] Inserting variable(s) in branch ${currentBranchStartNodeId} -> ${currentBranchEndNodeId}`);
        const insertionPredecessorId = findPredecessorNodeInPath(currentBranchStartNodeId, currentBranchEndNodeId, edges.value);
        console.log(`[onVariablesUpdate] Found predecessor: ${insertionPredecessorId} for new variable(s)`);

        const edgeToRemoveIndex = edges.value.findIndex(
            e => e.source === insertionPredecessorId && e.target === currentBranchEndNodeId
        );

        if (edgeToRemoveIndex !== -1) {
            console.log(`[onVariablesUpdate] Removing edge: ${edges.value[edgeToRemoveIndex].source} -> ${edges.value[edgeToRemoveIndex].target} (ID: ${edges.value[edgeToRemoveIndex].id})`);
            edges.value.splice(edgeToRemoveIndex, 1);
        } else {
            if (insertionPredecessorId === currentBranchStartNodeId &&
                !edges.value.some(e => e.source === currentBranchStartNodeId && e.target === currentBranchEndNodeId)) {
                 console.warn(`[onVariablesUpdate] Branch from ${currentBranchStartNodeId} to ${currentBranchEndNodeId} seems already populated or path is broken. No direct edge removed.`);
            } else if (insertionPredecessorId !== currentBranchStartNodeId) {
                 console.warn(`[onVariablesUpdate] Edge from determined predecessor ${insertionPredecessorId} to ${currentBranchEndNodeId} not found to remove.`);
            } else {
                console.warn(`[onVariablesUpdate] No edge found from ${insertionPredecessorId} to ${currentBranchEndNodeId} to remove (predecessor might be start and no direct edge).`);
            }
        }

        const edge1Id = `e-${insertionPredecessorId}-${newNodes[0].id}-${Date.now()}`;
        console.log(`[onVariablesUpdate] Adding edge: ${insertionPredecessorId} -> ${newNodes[0].id} (ID: ${edge1Id})`);
        edges.value.push({
            id: edge1Id,
            source: insertionPredecessorId,
            target: newNodes[0].id,
        });

        const edge2Id = `e-${newNodes[newNodes.length - 1].id}-${currentBranchEndNodeId}-${Date.now()}`;
        console.log(`[onVariablesUpdate] Adding edge: ${newNodes[newNodes.length - 1].id} -> ${currentBranchEndNodeId} (ID: ${edge2Id})`);
        edges.value.push({
            id: edge2Id,
            source: newNodes[newNodes.length - 1].id,
            target: currentBranchEndNodeId,
        });

    } else if (nodes.value.length > newNodes.length) {
        const actualPreviousNodeIndex = nodes.value.length - newNodes.length - 1;
        if (actualPreviousNodeIndex >=0) {
             console.log(`[onVariablesUpdate] Connecting to previous node in main flow.`);
            connectToPreviousNode(nodes, edges, newNodes);
        } else {
            console.warn(`[onVariablesUpdate] No previous node to connect to in main flow, newNodes are first.`);
        }
    }

    console.log(`[onVariablesUpdate] Connecting new nodes sequentially: ${newNodes.map(n=>n.id).join(' -> ')}`);
    connectNewNodesSequentially(edges, newNodes);

    // Commenting out loopNodePairs and end-loop cleanup for now to isolate branch logic.
    /*
    if (loopNodePairs?.length) {
        loopNodePairs.forEach(({ loopNodeId, endId }) => {
            // reconnectLoopEdges(edges, newNodes, loopNodeId, endId);
        });
    }
    edges.value = edges.value.filter(e => !e.source.startsWith('end-loop'));
    */

    console.log(`[onVariablesUpdate] Final edges count: ${edges.value.length}`);
    edges.value = [...edges.value]; // Ensure reactivity
    return newNodes;
}

// --- Utility functions kept from original file, potentially for review/refinement later ---

// reconnectLoopEdges: This function's interaction with the new branch logic needs careful review.
// If newNodes are inserted *within* a loop defined by loopNodeId and endId,
// the main branch logic in onVariablesUpdate/handleOperationUpdate should handle it
// if currentBranchStartNodeId = loopNodeId and currentBranchEndNodeId = endId.
// This function might be for other loop-specific edge cases.
function reconnectLoopEdges(edges: Ref<Edge[]>, newNodes: Node[], loopNodeId: string, endId: string) {
    console.log(`[reconnectLoopEdges] For loop ${loopNodeId} -> ${endId}, newNodes: ${newNodes.map(n=>n.id).join(',')}`);
    if (newNodes.length === 0) return;
    const firstNewNode = newNodes[0];
    const lastNewNode = newNodes[newNodes.length - 1];

    const edgeToEnd = edges.value.find(e =>
        e.target === endId && (e.source === loopNodeId || e.source.startsWith('var-') || e.source.startsWith('op-') || e.source.startsWith('cond-') || e.source.startsWith('ret-'))
    );
    const previousNodeIdInLoop = edgeToEnd?.source ?? loopNodeId;
    console.log(`[reconnectLoopEdges] Previous node in loop for ${endId} was ${previousNodeIdInLoop}`);


    if (previousNodeIdInLoop) {
        const edgeIndex = edges.value.findIndex(e => e.source === previousNodeIdInLoop && e.target === endId);
        if (edgeIndex !== -1) {
            console.log(`[reconnectLoopEdges] Removing edge ${previousNodeIdInLoop} -> ${endId}`);
            edges.value.splice(edgeIndex, 1);
        }

        if (previousNodeIdInLoop !== firstNewNode.id && previousNodeIdInLoop !== lastNewNode.id ) { // Avoid connecting to self if it's the only node
             console.log(`[reconnectLoopEdges] Adding edge ${previousNodeIdInLoop} -> ${firstNewNode.id}`);
            edges.value.push({
                id: `e-${previousNodeIdInLoop}-${firstNewNode.id}-${Date.now()}`,
                source: previousNodeIdInLoop,
                target: firstNewNode.id,
            });
        }
    }

    console.log(`[reconnectLoopEdges] Adding edge ${lastNewNode.id} -> ${endId}`);
    edges.value.push({
        id: `e-${lastNewNode.id}-${endId}-${Date.now()}`,
        source: lastNewNode.id,
        target: endId,
    });
}
