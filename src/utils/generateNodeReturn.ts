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

        existingNodes.push(returnNode);
        allNodes.push(returnNode);

        // La logique précédente pour 'lastTarget' connectait le retour au dernier nœud ajouté globalement.
        // Ceci est remplacé par une logique de branche plus spécifique ci-dessous.
        // const lastEdge = edgesRef?.value.at(-1);
        // const lastTarget = lastEdge?.target;
        // if (lastTarget) {
        //     edgesRef?.value.push({
        //         id: `e-${lastTarget}-${returnNode.id}`,
        //         source: lastTarget,
        //         target: returnNode.id,
        //     });
        // }

        if (parentBranchId && inferredEndConditionNodeId && edgesRef) {
            // Logique d'insertion dans une branche (similaire à onVariablesUpdate)
            let insertionPredecessorId = parentBranchId;
            const directEdgeIndex = edgesRef.value.findIndex(
                e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
            );

            if (directEdgeIndex !== -1) { // Branche vide
                edgesRef.value.splice(directEdgeIndex, 1);
            } else { // Branche non vide, trouver le prédécesseur
                let traverser = parentBranchId;
                const visited = new Set<string>();
                let foundInBranch = false;
                for (let i = 0; i < edgesRef.value.length + 5; i++) { // Safety break
                    if (visited.has(traverser)) {
                        insertionPredecessorId = traverser;
                        foundInBranch = true;
                        console.warn(`[generateReturnNodes] Cycle detected from ${parentBranchId}. Using ${traverser}.`);
                        break;
                    }
                    visited.add(traverser);
                    // Cherche une arête sortante qui n'est pas un retour direct au parentBranchId (pour éviter des boucles simples immédiates)
                    const outgoingEdge = edgesRef.value.find(e => e.source === traverser && e.target !== parentBranchId);
                    if (outgoingEdge) {
                        if (outgoingEdge.target === inferredEndConditionNodeId) {
                            insertionPredecessorId = traverser; // 'traverser' est le nœud juste avant la fin de la branche
                            foundInBranch = true;
                            break;
                        }
                        traverser = outgoingEdge.target; // Continuer la traversée
                    } else {
                        // Pas d'arête sortante, 'traverser' est le dernier nœud de ce chemin
                        insertionPredecessorId = traverser;
                        foundInBranch = true;
                        break;
                    }
                }
                 if (!foundInBranch) {
                     console.warn(`[generateReturnNodes] Could not find predecessor for ${inferredEndConditionNodeId} from ${parentBranchId}. Using ${insertionPredecessorId}.`);
                 }
                // Supprimer l'arête du prédécesseur déterminé vers la fin de la branche
                const predEdgeIdx = edgesRef.value.findIndex(e => e.source === insertionPredecessorId && e.target === inferredEndConditionNodeId);
                if (predEdgeIdx !== -1) {
                    edgesRef.value.splice(predEdgeIdx, 1);
                } else {
                    console.warn(`[generateReturnNodes] No edge from ${insertionPredecessorId} to ${inferredEndConditionNodeId} to remove.`);
                 }
            }

            // Connecter le prédécesseur au nouveau nœud de retour
            edgesRef.value.push({
                id: `e-${insertionPredecessorId}-${returnNode.id}-${Date.now()}`,
                source: insertionPredecessorId,
                target: returnNode.id,
            });
            // Connecter le nouveau nœud de retour à la fin de la branche
            edgesRef.value.push({
                id: `e-${returnNode.id}-${inferredEndConditionNodeId}-${Date.now()}`,
                source: returnNode.id,
                target: inferredEndConditionNodeId,
            });

            // La fonction insertReturnBetween n'est plus nécessaire si cette logique est utilisée.
            // insertReturnBetween(returnNode, parentBranchId, inferredEndConditionNodeId, edgesRef);

            if (loopNodePairs?.length) {
                 // La logique updateLoopEdges peut avoir besoin d'être revue pour s'assurer qu'elle
                 // ne crée pas de conflits avec le chaînage déjà établi.
                updateLoopEdges(edgesRef, returnNode, loopNodePairs, inferredEndConditionNodeId);
            }
        } else if (loopNodePairs && edgesRef) {
            // Cas où on ajoute un retour directement dans une boucle (pas une sous-branche de condition)
            loopNodePairs.forEach(({ loopNodeId, endId }) => {
                let loopInsertionPredecessor = loopNodeId;
                const directLoopEdge = edgesRef.value.findIndex(e => e.source === loopNodeId && e.target === endId);
                if (directLoopEdge !== -1) {
                    edgesRef.value.splice(directLoopEdge, 1);
                } else {
                    let traverser = loopNodeId;
                    const visited = new Set<string>();
                    for(let i=0; i < edgesRef.value.length + 5; ++i) { // Safety break
                        if(visited.has(traverser)) { loopInsertionPredecessor = traverser; break; }
                        visited.add(traverser);
                        const out = edgesRef.value.find(e => e.source === traverser && e.target !== loopNodeId);
                        if(out) {
                            if(out.target === endId) { loopInsertionPredecessor = traverser; break; }
                            traverser = out.target;
                        } else {
                            loopInsertionPredecessor = traverser; break;
                        }
                    }
                    const predEdgeToLoopEnd = edgesRef.value.findIndex(e => e.source === loopInsertionPredecessor && e.target === endId);
                    if(predEdgeToLoopEnd !== -1) {
                        edgesRef.value.splice(predEdgeToLoopEnd, 1);
                    } else {
                         console.warn(`[generateReturnNodes-loop] No edge from ${loopInsertionPredecessor} to ${endId} to remove.`);
                    }
                }
                edgesRef.value.push({ id: `e-${loopInsertionPredecessor}-${returnNode.id}-${Date.now()}`, source: loopInsertionPredecessor, target: returnNode.id });
                edgesRef.value.push({ id: `e-${returnNode.id}-${endId}-${Date.now()}`, source: returnNode.id, target: endId });
            });
        } else if (edgesRef) {
            // Fallback: ajout simple à la fin du dernier nœud global si aucun contexte de branche/boucle
            // existingNodes a déjà returnNode, donc on cherche l'avant-dernier ou le dernier dans edgesRef
            const lastOverallNodeId = edgesRef.value.length > 0 ?
                                      edgesRef.value.map(e => [e.source, e.target]).flat().filter(id => id !== returnNode.id).pop() :
                                      (existingNodes.length > 1 ? existingNodes[existingNodes.length - 2].id : null) ;
            if(lastOverallNodeId) {
                 edgesRef.value.push({
                    id: `e-${lastOverallNodeId}-${returnNode.id}-${Date.now()}`,
                    source: lastOverallNodeId,
                    target: returnNode.id,
                });
            } else {
                console.warn(`[generateReturnNodes] No last node found to connect return node ${returnNode.id}`);
            }
        }
    });

    if(edgesRef) edgesRef.value = [...edgesRef.value]; // Assurer la réactivité
    return { nodes: allNodes, edges: allEdges }; // allEdges est toujours vide, les modifs sont sur edgesRef
}



// function insertReturnBetween(
//     newReturnNode: Node,
//     parentBranchId: string,
//     inferredEndConditionNodeId: string,
//     edges: Ref<Edge[]>,
//     loopNodePairs?: { loopNodeId: string; endId: string }[],

// ) {
//     // Supprimer l’arête directe parent → end
//     const edgeIndex = edges.value.findIndex(
//         e => e.source === parentBranchId && e.target === inferredEndConditionNodeId
//     );
//     if (edgeIndex !== -1) {
//         edges.value.splice(edgeIndex, 1);
//     }

//     // Ajouter parent → condition
//     edges.value.push({
//         id: `e-${parentBranchId}-${newReturnNode.id}`,
//         source: parentBranchId,
//         target: newReturnNode.id,
//     });

//     edges.value.push({
//         id: `e-${newReturnNode.id}-${inferredEndConditionNodeId}`,
//         source: newReturnNode.id,
//         target: inferredEndConditionNodeId,
//     });

//     console.log(edges.value);

//     edges.value = [...edges.value];
// }

// export function generateReturnNodes(
//     returnEntries: ReturnEntry[],
//     existingNodes: Node[] = [],
//     inferredEndConditionNodeId?: string,
//     parentBranchId?: string,
//     edgesRef?: Ref<Edge[]>,
//     loopNodePairs?: { loopNodeId: string; endId: string }[],

// ): { nodes: Node[]; edges: Edge[] } {
//     const allNodes: Node[] = [];
//     const allEdges: Edge[] = [];

//     returnEntries.forEach((returns, index) => {
//         const returnName = returns.name;
//         const returnId = `ret-${returnName}`;

//         // Vérifier si le nœud existe déjà
//         if (existingNodes.some(n => n.id === returnId)) {
//             return;
//         }

//         // Créer le nœud de retour
//         const returnNode = new ReturnDefinitionVueFlowNode({
//             id: returnId,
//             type: 'return',
//             position: { x: 300, y: 100 + index * 500 },
//             data: { label: `Retour: ${returnName}`, name: returnName },
//             connectable: true,
//         }).node;

//         // allNodes.push(returnNode);
//         existingNodes.push(returnNode);
//         console.log(edgesRef?.value)
//         // Trouver le nœud source pour connecter au retour
//         const lastNode = existingNodes.find(n => n.id === parentBranchId);
//         const lastNodeMatches = lastNode?.data?.name?.includes(returnName);
//         const lastEdge = edgesRef?.value[edgesRef?.value.length - 1];
//         const lastTarget = lastEdge?.target;

//         console.log("Dernier target ajouté :", lastTarget);
//         // Ajouter arête source → retour
//         edgesRef?.value.push({
//             id: `e-${lastTarget}-${returnNode.id}`,
//             source: lastTarget!,
//             target: returnNode.id,
//         });

//         console.log(parentBranchId);
//         console.log(edgesRef?.value)

//         console.log(inferredEndConditionNodeId, "inferredEndId")

//         // Supprimer l’arête source → EndCondition si elle existe
//         if (parentBranchId && inferredEndConditionNodeId && edgesRef) {
//             const lastConnectedNode = edgesRef.value.findLast(
//                 e => e.target === inferredEndConditionNodeId
//             )?.source;

//             const dynamicParentId = lastConnectedNode ?? parentBranchId;

//             if (dynamicParentId) {
//                 insertReturnBetween(returnNode, dynamicParentId, inferredEndConditionNodeId, edgesRef);
//             }

//             if (loopNodePairs && loopNodePairs.length > 0) {
//                 const { loopNodeId: loopStartId, endId: loopEndId } = loopNodePairs[loopNodePairs.length - 1];

//                 const edgeIndex = edgesRef.value.findIndex(
//                     e => e.source === loopStartId && e.target === loopEndId
//                 );
//                 if (edgeIndex !== -1) {
//                     edgesRef.value.splice(edgeIndex, 1);
//                 }

//                 edgesRef.value.push(
//                     { id: `e-${loopStartId}-${returnNode.id}`, source: loopStartId, target: returnNode.id },
//                     { id: `e-${returnNode.id}-${loopEndId}`, source: returnNode.id, target: loopEndId },
//                     { id: `e-${loopEndId}-${inferredEndConditionNodeId}`, source: loopEndId, target: inferredEndConditionNodeId }
//                 );
//                 edgesRef.value = edgesRef.value.filter(e => !e.source.startsWith('ret-') || !e.target.startsWith('end-cond'));
//                 edgesRef.value = edgesRef.value.filter(e => !e.source.startsWith('end-loop-') || !e.target.startsWith('ret'));
//                 console.log(edgesRef.value);

//             }

//             // Attention : cette ligne supprime toutes les arêtes sortantes des nœuds "end-cond"
//             edgesRef.value = edgesRef.value.filter(e => !e.source.startsWith('end-cond'));
//         }

//         if (loopNodePairs && edgesRef) {
//             loopNodePairs.forEach(({ endId }) => {
//                 // Trouver le nœud actuellement connecté à endId (var ou op)
//                 const edgeToEnd = edgesRef.value.find(e =>
//                     e.target === endId && (e.source.startsWith('var-') || e.source.startsWith('op-') || e.source.startsWith('en-loop-') || e.source.startsWith('loop-'))
//                 );
//                 const previousNodeId = edgeToEnd?.source;
//                 console.log(previousNodeId);

//                 if (previousNodeId) {
//                     // Supprimer l’arête précédente → endId
//                     const edgeIndex = edgesRef.value.findIndex(
//                         e => e.source === previousNodeId && e.target === endId
//                     );
//                     if (edgeIndex !== -1) {
//                         edgesRef.value.splice(edgeIndex, 1);
//                     }
//                 }
//                 edgesRef.value.push({
//                     id: `e-${previousNodeId}-${returnNode.id}`,
//                     source: previousNodeId!,
//                     target: returnNode.id,
//                 });
//                 // Ajouter arête retour → endId
//                 edgesRef.value.push({
//                     id: `e-${returnNode.id}-${endId}`,
//                     source: returnNode.id,
//                     target: endId,
//                 });
//             });
//         }

//     });

//     return { nodes: allNodes, edges: allEdges };
// }


