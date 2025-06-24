import { ReturnDefinitionVueFlowNode } from '@/class/ReturnDefinitionVueFlowNode';
import type { ReturnEntry } from '@/utils/type';
import type { Edge, Node, Position, XYPosition } from "@vue-flow/core"; // Ajout de Position et XYPosition
import { Ref } from 'vue'; // Ajout de Ref

// Helper function to find the predecessor node in a path (copied from generateNodeVariableOrOperation.ts)
function findPredecessorNodeInPath(
    pathStartId: string,
    pathEndId: string,
    allEdges: Edge[]
): string {
    if (pathStartId === pathEndId) {
        console.log(`[findPredecessorNodeInPath (return)] pathStartId (${pathStartId}) is the same as pathEndId (${pathEndId}). Returning pathStartId.`);
        return pathStartId;
    }

    const queue: Array<{ nodeId: string, path: string[] }> = [{ nodeId: pathStartId, path: [pathStartId] }];
    const visitedInBfs = new Set<string>([pathStartId]);
    let pathToTarget: string[] | null = null;

    console.log(`[findPredecessorNodeInPath (return)] Starting BFS from ${pathStartId} to ${pathEndId}`);

    while (queue.length > 0) {
        const current = queue.shift()!;
        // console.log(`[findPredecessorNodeInPath (return)] BFS visiting: ${current.nodeId}, path: [${current.path.join(', ')}]`);

        const neighbors = allEdges.filter(edge => edge.source === current.nodeId);
        for (const edge of neighbors) {
            // console.log(`[findPredecessorNodeInPath (return)] Checking neighbor: ${edge.target} from ${current.nodeId}`);
            if (edge.target === pathEndId) {
                pathToTarget = [...current.path, edge.target];
                // console.log(`[findPredecessorNodeInPath (return)] Found path to target: [${pathToTarget.join(', ')}]`);
                queue.length = 0;
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
        console.log(`[findPredecessorNodeInPath (return)] Path found. Predecessor to ${pathEndId} is ${predecessor}`);
        return predecessor;
    }

    console.log(`[findPredecessorNodeInPath (return)] No direct path found or path too short. Returning pathStartId: ${pathStartId}`);
    return pathStartId;
}


function createReturnNode(entry: ReturnEntry, index: number, existingNodeCount: number): Node {
    // Ensure unique ID for return nodes
    const returnId = `ret-${entry.name}-${existingNodeCount + index}-${Date.now()}`;
    console.log(`[createReturnNode] Creating return node: ${returnId} - ${entry.name}`);
    return new ReturnDefinitionVueFlowNode({
        id: returnId,
        type: 'return',
        position: { x: 300, y: 100 + (existingNodeCount + index) * 100 }, // Adjust Y based on total nodes for better layout
        data: { label: `Retour: ${entry.name}`, name: entry.name },
        connectable: true,
    }).node;
}

// updateLoopEdges might need a review for how it interacts with the new precise chaining.
// It currently makes broad assumptions about edge structure.
function updateLoopEdges(
    edges: Ref<Edge[]>,
    returnNode: Node,
    loopNodePairs: { loopNodeId: string; endId: string }[],
    // inferredEndConditionNodeId here is likely the end of the main branch, *after* the loop structure.
    mainBranchEndNodeId: string
) {
    console.log(`[updateLoopEdges] For returnNode ${returnNode.id}, loopNodePairs:`, loopNodePairs, `mainBranchEndNodeId: ${mainBranchEndNodeId}`);
    // This function seems to assume the returnNode is *inside* the last loop of loopNodePairs
    // and then connects that loop's end to the mainBranchEndNodeId.
    // This might be too specific or conflict if the return node is in a different context.

    // Let's simplify or make it more context-aware.
    // For now, this function might be problematic if the return node is inserted
    // into a branch that itself is inside a loop. The primary branch insertion logic
    // should handle the connections *within* that branch. This function seems to
    // be for a different scenario, e.g. a return node terminating a loop directly.

    // Example: If a return node is the *only* thing in a loop: LoopStart -> Return -> LoopEnd
    // And the loop itself is in a branch: BranchStart -> LoopStart ... LoopEnd -> BranchEnd
    // The main insertion logic should handle BranchStart -> Return -> BranchEnd (if return is in branch)
    // Or LoopStart -> Return -> LoopEnd (if return is in loop)

    // This function's current implementation is very specific and might be overly complex
    // or cause issues. It tries to rewire a loop around the return node.
    // It's safer to ensure the primary insertion logic is correct first.
    // I will comment out the complex parts of it for now.

    // const { loopNodeId, endId } = loopNodePairs[loopNodePairs.length - 1];

    // const edgeIndex = edges.value.findIndex(e => e.source === loopNodeId && e.target === endId);
    // if (edgeIndex !== -1) {
    //     console.log(`[updateLoopEdges] Removing direct loop edge ${loopNodeId} -> ${endId}`);
    //     edges.value.splice(edgeIndex, 1);
    // }

    // console.log(`[updateLoopEdges] Adding edges: ${loopNodeId} -> ${returnNode.id}, ${returnNode.id} -> ${endId}, ${endId} -> ${mainBranchEndNodeId}`);
    // edges.value.push(
    //     { id: `e-${loopNodeId}-${returnNode.id}-${Date.now()}`, source: loopNodeId, target: returnNode.id },
    //     { id: `e-${returnNode.id}-${endId}-${Date.now()}`, source: returnNode.id, target: endId }
    // );
    // If mainBranchEndNodeId is actually different from endId (loop's own end)
    // if (endId !== mainBranchEndNodeId) {
    //     edges.value.push(
    //         { id: `e-${endId}-${mainBranchEndNodeId}-${Date.now()}`, source: endId, target: mainBranchEndNodeId }
    //     );
    // }

    // These filters are very broad and could remove intended edges.
    // edges.value = edges.value.filter(e => !e.source.startsWith('ret-') || !e.target.startsWith('end-cond'));
    // edges.value = edges.value.filter(e => !e.source.startsWith('end-loop-') || !e.target.startsWith('ret'));
    console.warn("[updateLoopEdges] Logic is complex and potentially conflicting. Review needed if loop behavior is incorrect.");
}

export function generateReturnNodes(
    returnEntries: ReturnEntry[],
    currentNodes: Node[] = [], // Renamed from existingNodes for clarity
    // These define the branch where the return node(s) should be inserted
    branchEndNodeId?: string, // Renamed from inferredEndConditionNodeId
    branchStartNodeId?: string, // Renamed from parentBranchId
    edgesRef?: Ref<Edge[]>,
    loopNodePairs?: { loopNodeId: string; endId: string }[]
): { nodes: Node[]; edges: Edge[] } {
    const newNodesOutput: Node[] = []; // Nodes created in this specific call
    // allEdges is not used as modifications are direct to edgesRef.
    // const allEdges: Edge[] = [];

    if (!edgesRef) {
        console.error("[generateReturnNodes] edgesRef is undefined. Cannot modify edges.");
        return { nodes: newNodesOutput, edges: [] };
    }

    returnEntries.forEach((entry, index) => {
        // Check for existing node by name (simple check, might need more robust ID check if names can repeat)
        // if (currentNodes.some(n => n.type ==='return' && n.data?.name === entry.name)) return;

        const returnNode = createReturnNode(entry, index, currentNodes.length);
        // It's important that `currentNodes` (passed as `existingNodes` from the component)
        // is the reactive list from the component (`nodes.value`) so that its length is accurate.
        // The component should push `returnNode` to its main `nodes` list.
        // This function will return `newNodesOutput` for the component to do that.
        newNodesOutput.push(returnNode);
        // currentNodes.push(returnNode); // Avoid modifying currentNodes directly if it's a copy

        console.log(`[generateReturnNodes] Processing return entry: ${entry.name}, Node ID: ${returnNode.id}`);

        if (branchStartNodeId && branchEndNodeId) {
            console.log(`[generateReturnNodes] Inserting return ${returnNode.id} in branch ${branchStartNodeId} -> ${branchEndNodeId}`);
            const insertionPredecessorId = findPredecessorNodeInPath(branchStartNodeId, branchEndNodeId, edgesRef.value);
            console.log(`[generateReturnNodes] Found predecessor: ${insertionPredecessorId} for return ${returnNode.id}`);

            const edgeToRemoveIndex = edgesRef.value.findIndex(
                e => e.source === insertionPredecessorId && e.target === branchEndNodeId
            );

            if (edgeToRemoveIndex !== -1) {
                console.log(`[generateReturnNodes] Removing edge: ${edgesRef.value[edgeToRemoveIndex].source} -> ${edgesRef.value[edgeToRemoveIndex].target} (ID: ${edgesRef.value[edgeToRemoveIndex].id})`);
                edgesRef.value.splice(edgeToRemoveIndex, 1);
            } else {
                if (insertionPredecessorId === branchStartNodeId &&
                    !edgesRef.value.some(e => e.source === branchStartNodeId && e.target === branchEndNodeId)) {
                     console.warn(`[generateReturnNodes] Branch from ${branchStartNodeId} to ${branchEndNodeId} seems already populated or path is broken. No direct edge removed.`);
                } else if (insertionPredecessorId !== branchStartNodeId){
                     console.warn(`[generateReturnNodes] Edge from determined predecessor ${insertionPredecessorId} to ${branchEndNodeId} not found to remove.`);
                } else {
                    console.warn(`[generateReturnNodes] No edge found from ${insertionPredecessorId} to ${branchEndNodeId} to remove (predecessor might be start and no direct edge).`);
                }
            }

            const edge1Id = `e-${insertionPredecessorId}-${returnNode.id}-${Date.now()}`;
            console.log(`[generateReturnNodes] Adding edge: ${insertionPredecessorId} -> ${returnNode.id} (ID: ${edge1Id})`);
            edgesRef.value.push({
                id: edge1Id,
                source: insertionPredecessorId,
                target: returnNode.id,
            });

            // A return node is typically a terminal node within its branch.
            // So, it connects to the branchEndNodeId.
            const edge2Id = `e-${returnNode.id}-${branchEndNodeId}-${Date.now()}`;
            console.log(`[generateReturnNodes] Adding edge: ${returnNode.id} -> ${branchEndNodeId} (ID: ${edge2Id})`);
            edgesRef.value.push({
                id: edge2Id,
                source: returnNode.id,
                target: branchEndNodeId,
            });

            if (loopNodePairs?.length) {
                // updateLoopEdges might be called if the branch itself is part of a loop structure
                // that needs special handling for return statements (e.g., breaking out).
                // Its current implementation is complex and might need review.
                // updateLoopEdges(edgesRef, returnNode, loopNodePairs, branchEndNodeId);
                console.log("[generateReturnNodes] loopNodePairs present, updateLoopEdges was called (now commented). Review its logic if loop behavior with returns is incorrect.");
            }
        } else if (loopNodePairs && loopNodePairs.length > 0 && edgesRef) {
            // This case is for adding a return node directly inside a loop,
            // not within a sub-branch (like a condition inside a loop).
            console.log(`[generateReturnNodes] Inserting return ${returnNode.id} directly into a loop context.`);
            // Assuming the return is added to the *last* loop in the pairs for now.
            const targetLoop = loopNodePairs[loopNodePairs.length - 1];
            const { loopNodeId, endId: loopEndId } = targetLoop;

            const insertionPredecessorInLoop = findPredecessorNodeInPath(loopNodeId, loopEndId, edgesRef.value);
            console.log(`[generateReturnNodes-loop] Found predecessor in loop ${loopNodeId}: ${insertionPredecessorInLoop}`);

            const edgeToLoopEndIndex = edgesRef.value.findIndex(e => e.source === insertionPredecessorInLoop && e.target === loopEndId);
            if (edgeToLoopEndIndex !== -1) {
                console.log(`[generateReturnNodes-loop] Removing edge: ${edgesRef.value[edgeToLoopEndIndex].source} -> ${edgesRef.value[edgeToLoopEndIndex].target}`);
                edgesRef.value.splice(edgeToLoopEndIndex, 1);
            } else {
                 console.warn(`[generateReturnNodes-loop] No edge from ${insertionPredecessorInLoop} to ${loopEndId} to remove.`);
            }

            edgesRef.value.push({ id: `e-${insertionPredecessorInLoop}-${returnNode.id}-${Date.now()}`, source: insertionPredecessorInLoop, target: returnNode.id });
            // Return node inside a loop typically connects to the loop's end node.
            edgesRef.value.push({ id: `e-${returnNode.id}-${loopEndId}-${Date.now()}`, source: returnNode.id, target: loopEndId });

        } else if (edgesRef) {
            // Fallback: Simple append if no specific branch or loop context.
            // Connect to the very last node in the graph if possible.
            console.log(`[generateReturnNodes] Fallback: Inserting return ${returnNode.id} at the end of the main flow.`);
            let lastOverallNodeId: string | null = null;
            if (currentNodes.length > newNodesOutput.length) { // Check if there were nodes before adding this one
                 lastOverallNodeId = currentNodes[currentNodes.length - newNodesOutput.length -1].id;
            } else if (edgesRef.value.length > 0) {
                // If no prior nodes in currentNodes list (e.g. first node ever), try finding true last node from edges
                 const allNodeIdsInEdges = new Set<string>();
                 edgesRef.value.forEach(e => {allNodeIdsInEdges.add(e.source); allNodeIdsInEdges.add(e.target); });
                 // A simple heuristic: find a node that is a source but not a target, or has no outgoing edges.
                 // This is complex. A simpler last node could be from currentNodes if available.
                 // This fallback needs a robust way to find the "end" of the current flow.
            }

            if(lastOverallNodeId) {
                 console.log(`[generateReturnNodes] Fallback: Connecting after ${lastOverallNodeId}`);
                 edgesRef.value.push({
                    id: `e-${lastOverallNodeId}-${returnNode.id}-${Date.now()}`,
                    source: lastOverallNodeId,
                    target: returnNode.id,
                });
                // Return nodes are often terminal, so no outgoing edge unless explicitly connected to a graph end.
            } else {
                console.warn(`[generateReturnNodes] Fallback: No last node found to connect return node ${returnNode.id}. It will be orphaned unless connected manually.`);
            }
        }
    });

    if(edgesRef) {
        edgesRef.value = [...edgesRef.value];
        console.log(`[generateReturnNodes] Final edges count: ${edgesRef.value.length}`);
    }
    return { nodes: newNodesOutput, edges: [] }; // allEdges is not used
}
