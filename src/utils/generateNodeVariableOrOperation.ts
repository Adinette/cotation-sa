import { VariableDefinitionVueFlowNode } from "@/class/VariableDefinitionVueFlowNode";
import { Edge, Node } from "@vue-flow/core";
import { VariableEntry } from "./type";

// Variables
function generateVariableNodes(variables: VariableEntry[], startIndex = 0): Node[] {
    return variables.map((variable, index) => {
        const mainVar = `${variable?.name ?? ''} = ${variable?.operation ?? ''}`;
        const nodeData = {
            id: `var-${startIndex + index}`,
            position: { x: 100 + (startIndex + index) * 200, y: 100 },
            type: 'define_variable',
            data: {
                label: `Déclaration de la variable: ${mainVar}`, name: variable?.name ?? '',
            }, connectable: true,
        }
        const nodeInstance = new VariableDefinitionVueFlowNode(nodeData)

        return nodeInstance.node
    })
}

function reconnectLoopEdges(edges: Ref<Edge[]>, newNodes: Node[], loopNodeId: string, endId: string) {
    const firstNewNode = newNodes[0];
    const lastNewNode = newNodes[newNodes.length - 1];

    const edgeToEnd = edges.value.find(e =>
        e.target === endId && (e.source.startsWith('var-') || e.source === loopNodeId)
    );
    const previousNodeId = edgeToEnd?.source;

    if (previousNodeId) {
        const edgeIndex = edges.value.findIndex(e => e.source === previousNodeId && e.target === endId);
        if (edgeIndex !== -1) edges.value.splice(edgeIndex, 1);

        if (!previousNodeId.startsWith('end-loop')) {
            edges.value.push({
                id: `e-${previousNodeId}-${firstNewNode.id}`,
                source: previousNodeId,
                target: firstNewNode.id,
            });
        }
    }

    edges.value.push({
        id: `e-${lastNewNode.id}-${endId}`,
        source: lastNewNode.id,
        target: endId,
    });
}

function reconnectToEndCondition(
    edges: Ref<Edge[]>,
    newNodes: Node[],
    parentBranchId: string,
    inferredEndConditionNodeId: string,
    loopNodePairs?: { loopNodeId: string; endId: string }[]
) {
    const firstNewNode = newNodes[0];
    const lastConnectedNodeId = [...edges.value]
        .reverse()
        .find(e => e.target === inferredEndConditionNodeId)?.source;

    const dynamicParentId = lastConnectedNodeId ?? parentBranchId;

    const edgeIndex = edges.value.findIndex(
        e => e.source === dynamicParentId && e.target === inferredEndConditionNodeId
    );
    if (edgeIndex !== -1) edges.value.splice(edgeIndex, 1);

    edges.value.push({
        id: `e-${dynamicParentId}-${firstNewNode.id}`,
        source: dynamicParentId,
        target: firstNewNode.id,
    });

    if (!loopNodePairs?.length) {
        edges.value.push({
            id: `e-${firstNewNode.id}-${inferredEndConditionNodeId}`,
            source: firstNewNode.id,
            target: inferredEndConditionNodeId,
        });
    } else {
        const loopEndId = loopNodePairs.find(e => e.endId)?.endId;
        if (loopEndId) {
            edges.value.push({
                id: `e-${loopEndId}-${inferredEndConditionNodeId}`,
                source: loopEndId,
                target: inferredEndConditionNodeId,
            });
        }
    }
}

function connectToPreviousNode(nodes: Ref<Node[]>, edges: Ref<Edge[]>, newNodes: Node[]) {
    const previousNode = nodes.value[nodes.value.length - newNodes.length - 1];
    const firstNewNode = newNodes[0];

    edges.value.push({
        id: `e-${previousNode.id}-${firstNewNode.id}`,
        source: previousNode.id,
        target: firstNewNode.id,
    });
}

function connectNewNodesSequentially(edges: Ref<Edge[]>, newNodes: Node[]) {
    for (let i = 0; i < newNodes.length - 1; i++) {
        edges.value.push({
            id: `e-${newNodes[i].id}-${newNodes[i + 1].id}`,
            source: newNodes[i].id,
            target: newNodes[i + 1].id,
        });
    }
}

function createOperationNode(vars: VariableEntry[]): Node {
    const label = vars.map(v => v?.name).join(' + ');
    const operation = vars.map(v => v?.operation).join(' + ');
    const operationLabel = `Opération: ${label} = ${operation}`;

    return {
        id: `op-${Date.now()}`,
        type: "operation",
        position: { x: 300, y: 300 },
        data: { label: operationLabel },
        connectable: true,
    };
}

function handleOperationUpdate(
    vars: VariableEntry[],
    nodes: Ref<Node[]>,
    edges: Ref<Edge[]>,
    inferredEndConditionNodeId: string,
    loopNodePairs?: { loopNodeId: string; endId: string }[]
): void {
    const label = vars.map(v => v?.name).join(' + ');
    const operation = vars.map(v => v?.operation).join(' + ');
    const operationLabel = `Opération: ${label} = ${operation}`;

    const existingOperation = nodes.value.find(
        n => n.type === 'operation' && n.data?.label === operationLabel
    );
    if (existingOperation) return;

    const operationNode = createOperationNode(vars);
    nodes.value.push(operationNode);

    // vars: VariableEntry[], // Parameters for the operation
    // nodes: Ref<Node[]>,
    // edges: Ref<Edge[]>,
    // branchEndNodeId: string,
    // branchStartNodeId?: string,
    // loopNodePairs?: { loopNodeId: string; endId: string }[]
    // ): void {

    const operationDisplayLabel = `Opération: ${vars.map(v => v?.name).join(' + ')} = ${vars.map(v => v?.operation).join(' + ')}`;

    const existingOperation = nodes.value.find(
        n => n.type === 'operation' && n.data?.label === operationDisplayLabel
    );
    if (existingOperation) {
        console.log("Operation node already exists:", operationDisplayLabel);
        return; // Avoid creating duplicate operations
    }

    const operationNode = createOperationNode(vars);
    nodes.value.push(operationNode);

    if (parentBranchId && inferredEndConditionNodeId) {
        // We are inserting within a defined branch (e.g., Then, Else, Loop body)
        let insertionPredecessorId = parentBranchId; // Start by assuming the branch is empty or we connect to the start

        const directEdgeIndex = edges.value.findIndex(
            e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
        );

        if (directEdgeIndex !== -1) {
            // Case 1: Branch is empty (parentBranchId -> inferredEndConditionNodeId)
            // Predecessor is parentBranchId. Remove this direct edge.
            edges.value.splice(directEdgeIndex, 1);
        } else {
            // Case 2: Branch is NOT empty. Traverse to find the true predecessor node.
            let traverser = parentBranchId;
            const visited = new Set<string>();
            let foundInBranch = false; // Flag to confirm predecessor was found within the branch path

            for (let i = 0; i < edges.value.length + 5; i++) { // Safety break for traversal
                if (visited.has(traverser)) { // Cycle detected
                    insertionPredecessorId = traverser; // Use current node in cycle as best guess
                    foundInBranch = true;
                    console.warn(`[handleOperationUpdate] Cycle detected from ${parentBranchId}. Using ${traverser}.`);
                    break;
                }
                visited.add(traverser);

                const outgoingEdge = edges.value.find(e => e.source === traverser && e.target !== parentBranchId);
                if (outgoingEdge) {
                    if (outgoingEdge.target === inferredEndConditionNodeId) {
                        insertionPredecessorId = traverser; // Found node just before the branch end
                        foundInBranch = true;
                        break;
                    }
                    traverser = outgoingEdge.target; // Continue along the branch
                } else {
                    insertionPredecessorId = traverser; // Reached a dead-end, this is the last node
                    foundInBranch = true;
                    break;
                }
            }
            if (!foundInBranch) {
                console.warn(`[handleOperationUpdate] Could not find predecessor for ${inferredEndConditionNodeId} from ${parentBranchId}. Using ${insertionPredecessorId}.`);
            }

            // Remove the edge from the determined predecessor to the branch end
            const predEdgeIdx = edges.value.findIndex(e => e.source === insertionPredecessorId && e.target === inferredEndConditionNodeId);
            if (predEdgeIdx !== -1) {
                edges.value.splice(predEdgeIdx, 1);
            } else {
                console.warn(`[handleOperationUpdate] No edge from ${insertionPredecessorId} to ${inferredEndConditionNodeId} to remove.`);
            }
        }

        // Connect insertionPredecessorId -> operationNode
        edges.value.push({
            id: `e-${insertionPredecessorId}-${operationNode.id}-${Date.now()}`,
            source: insertionPredecessorId,
            target: operationNode.id,
        });

        // Connect operationNode -> inferredEndConditionNodeId (the end of the current branch)
        edges.value.push({
            id: `e-${operationNode.id}-${inferredEndConditionNodeId}-${Date.now()}`,
            source: operationNode.id,
            target: inferredEndConditionNodeId,
        });
    } else {
        // Fallback for operations added without a clear branch context
        console.warn(`[handleOperationUpdate] Operation node "${operationNode.id}" added without clear branch context. Attempting to connect to last known node.`);
        const lastNodeOverall = nodes.value.filter(n => n.id !== operationNode.id && !n.id.startsWith("end-")).pop();
        if (lastNodeOverall) {
            edges.value.push({
                id: `e-${lastNodeOverall.id}-${operationNode.id}-${Date.now()}`,
                source: lastNodeOverall.id,
                target: operationNode.id,
            });
            // Note: The output of this operation node is not connected to anything in this fallback.
            // This might be acceptable if operations can be terminal, or if a global "end graph" node is assumed.
        } else {
            console.warn(`[handleOperationUpdate] No previous node found to connect to operation ${operationNode.id}.`);
        }
    }

    edges.value = [...edges.value]; // Ensure reactivity
}

// connectVariablesToOperation IS NO LONGER USED FOR MAIN FLOW CONTROL
// It should only create dependency edges if that's a feature.
// For now, it's removed to simplify main flow logic.
/*
function connectVariablesToOperation(
    vars: VariableEntry[],
    operationNode: Node,
    nodes: Ref<Node[]>,
    edges: Ref<Edge[]>,
    inferredEndConditionNodeId: string,
    loopNodePairs?: { loopNodeId: string; endId: string }[],
) {
    // ... existing implementation ...
}
*/

export function onVariablesUpdate(
    newVariables: VariableEntry | VariableEntry[],
    type: 'variable' | 'operation',
    nodes: Ref<Node[]>,
    edges: Ref<Edge[]>,
    formVariables: Ref<VariableEntry[]>,
    inferredEndConditionNodeId: string,
    parentBranchId?: string,
    loopNodePairs?: { loopNodeId: string; endId: string }[],
): Node[] {
    const vars = Array.isArray(newVariables) ? newVariables : [newVariables];
    const newUniqueVars = vars.filter(v => !formVariables.value.some(existing => existing.name === v.name));

    // ✅ Si c'est une opération, on la traite et on sort
    if (type === 'operation') {
        handleOperationUpdate(vars, nodes, edges, inferredEndConditionNodeId, loopNodePairs);
        return [];
    }

    formVariables.value.push(...newUniqueVars);

    const startIndex = nodes.value.length;
    const newNodes = generateVariableNodes(newUniqueVars, startIndex);
    nodes.value.push(...newNodes);

    if (newUniqueVars.length === 0 && type === 'variable') return []; // No new unique variables to add for type 'variable'

    const newNodes = type === 'variable' ? generateVariableNodes(newUniqueVars, nodes.value.length) : [];

    if (type === 'variable') {
        nodes.value.push(...newNodes);
    }

    if (newNodes.length === 0 && type === 'variable') { // Check again in case generateVariableNodes returned empty for some reason
        return [];
    }

    // Handle connection logic only if there are new nodes (for type 'variable')
    // or if it's an operation (handled by handleOperationUpdate)
    if (type === 'variable' && newNodes.length > 0) {
        if (parentBranchId && inferredEndConditionNodeId) {
            // We are inserting within a defined branch (e.g., Then, Else, Loop body)
            let insertionPredecessorId = parentBranchId;

            const directEdgeIndex = edges.value.findIndex(
                e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
            );

            if (directEdgeIndex !== -1) {
                // Case 1: Branch is empty (parentBranchId -> inferredEndConditionNodeId)
                // Predecessor is parentBranchId. Remove this direct edge.
                edges.value.splice(directEdgeIndex, 1);
            } else {
                // Case 2: Branch is NOT empty. Traverse to find the true predecessor.
                let traverser = parentBranchId;
                const visited = new Set<string>();
                let foundPredecessorInBranch = false;

                for (let i = 0; i < edges.value.length + 5; i++) { // Safety break against very long/cyclic paths
                    if (visited.has(traverser)) { // Cycle detected
                        console.warn(`[onVariablesUpdate] Cycle detected while finding predecessor from ${parentBranchId}. Using ${traverser} as predecessor.`);
                        insertionPredecessorId = traverser;
                        foundPredecessorInBranch = true;
                        break;
                    }
                    visited.add(traverser);

                    // Find the next node in the current branch path
                    // This simple traversal assumes a single primary path within the branch.
                    // It looks for an edge that is not leading back to the start or directly to the global end (if not part of this branch).
                    const outgoingEdge = edges.value.find(e => e.source === traverser && e.target !== parentBranchId);

                    if (outgoingEdge) {
                        if (outgoingEdge.target === inferredEndConditionNodeId) {
                            insertionPredecessorId = traverser; // 'traverser' is the node just before the branch end.
                            foundPredecessorInBranch = true;
                            break;
                        }
                        traverser = outgoingEdge.target; // Continue traversal
                    } else {
                        // No outgoing edge found from 'traverser', so 'traverser' is the last node in this path.
                        insertionPredecessorId = traverser;
                        foundPredecessorInBranch = true;
                        break;
                    }
                }
                if (!foundPredecessorInBranch) {
                     console.warn(`[onVariablesUpdate] Could not reliably find predecessor for ${inferredEndConditionNodeId} from branch ${parentBranchId}. Defaulting to ${insertionPredecessorId}.`);
                }

                // Remove the edge from the found/determined predecessor to the branch end, if it exists
                const predEdgeIdx = edges.value.findIndex(e => e.source === insertionPredecessorId && e.target === inferredEndConditionNodeId);
                if (predEdgeIdx !== -1) {
                    edges.value.splice(predEdgeIdx, 1);
                } else {
                     console.warn(`[onVariablesUpdate] No edge found from determined predecessor ${insertionPredecessorId} to ${inferredEndConditionNodeId} to remove. Branch might be structured differently.`);
                }
            }

            // Connect insertionPredecessorId -> firstNewNode
            edges.value.push({
                id: `e-${insertionPredecessorId}-${newNodes[0].id}-${Date.now()}`,
                source: insertionPredecessorId,
                target: newNodes[0].id,
            });

            // Connect lastNewNode -> inferredEndConditionNodeId (the end of the current branch)
            edges.value.push({
                id: `e-${newNodes[newNodes.length - 1].id}-${inferredEndConditionNodeId}-${Date.now()}`,
                source: newNodes[newNodes.length - 1].id,
                target: inferredEndConditionNodeId,
            });

        } else if (nodes.value.length > newNodes.length) {
            // Not inserting in a specific branch, but appending to the main flow (if applicable)
            // This case might need re-evaluation based on how `parentBranchId` and `inferredEndConditionNodeId` are set for non-branch appends.
            // For now, assuming connectToPreviousNode handles simple sequential appends if no branch context.
            connectToPreviousNode(nodes, edges, newNodes);
        }

        connectNewNodesSequentially(edges, newNodes);

    } else if (type === 'operation') {
        // Operation logic is separate and might also need review for correct predecessor finding if complex chaining is needed.
        // For now, it's outside the scope of this specific variable chaining fix.
    }


    if (loopNodePairs?.length) {
        // This logic for reconnectLoopEdges might need to be aware of the changes above,
        // especially if variables are added inside a loop that is also inside a condition branch.
        // For now, keeping it separate. It primarily deals with edges directly to/from loop start/end.
        loopNodePairs.forEach(({ loopNodeId, endId }) => {
            // Check if the new nodes were inserted inside THIS specific loop
            let insertedInThisLoop = false;
            if (parentBranchId === loopNodeId && inferredEndConditionNodeId === endId) {
                insertedInThisLoop = true;
            }
            // Add more sophisticated check if newNodes[0].id is now between loopNodeId and endId

            // The original reconnectLoopEdges might be too aggressive or misplace edges
            // if the new nodes are already correctly placed by the logic above.
            // This needs careful review.
            // For now, let's assume the above logic correctly places nodes within a loop if parent/end are loop start/end.
            // reconnectLoopEdges(edges, newNodes, loopNodeId, endId); // Potentially comment out or refine
        });
    }

    edges.value = [...edges.value]; // Ensure reactivity

    // Nettoyage des arêtes inutiles (cette ligne est très spécifique, vérifier si toujours nécessaire)
    // edges.value = edges.value.filter(e => !e.source.startsWith('end-loop')); // Example: might remove valid edges

    return newNodes;
}
