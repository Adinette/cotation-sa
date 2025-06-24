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
            // Correction: Utiliser parentBranchId directement comme point de départ de la branche
            // au lieu de chercher un 'lastConnectedNode' qui pourrait être sur une autre branche.
            insertReturnBetween(returnNode, parentBranchId, inferredEndConditionNodeId, edgesRef);

            if (loopNodePairs?.length) {
                // Si on est dans une boucle, la logique updateLoopEdges gère spécifiquement
                // comment le nœud de retour s'insère par rapport à la boucle.
                // Cette fonction peut avoir besoin d'être revue pour s'assurer qu'elle
                // respecte le parentBranchId si celui-ci est à l'intérieur de la boucle.
                // Pour l'instant, on suppose qu'elle est appelée après insertReturnBetween
                // et qu'elle ajuste les arêtes de la boucle en conséquence.
                updateLoopEdges(edgesRef, returnNode, loopNodePairs, inferredEndConditionNodeId);
            }

            // Cette ligne semble trop agressive. Elle supprime toutes les arêtes sortant des nœuds "end-cond".
            // Elle devrait être plus ciblée si une suppression est nécessaire.
            // Commentée pour l'instant, car insertReturnBetween devrait gérer les reconnexions nécessaires.
            // edgesRef.value = edgesRef.value.filter(e => !e.source.startsWith('end-cond'));
        }

        // Cette section semble redondante ou conflictuelle avec la section précédente
        // si parentBranchId et inferredEndConditionNodeId sont déjà fournis (ce qui est le cas pour l'imbrication).
        // Elle est plus pertinente si on ajoute un retour dans un contexte de boucle simple sans branche conditionnelle.
        // Il faudrait clarifier quand chaque section doit s'appliquer.
        // Pour l'instant, on se concentre sur la correction de l'imbrication via parentBranchId.
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


