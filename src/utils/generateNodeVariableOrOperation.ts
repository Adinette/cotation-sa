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

    if (loopNodePairs?.length) {
        loopNodePairs.forEach(({ endId }) => {
            const edgeToEnd = edges.value.find(e =>
                e.target === endId && e.source.startsWith('var-')
            );
            const lastVarNodeId = edgeToEnd?.source;

            if (lastVarNodeId) {
                const edgeIndex = edges.value.findIndex(
                    e => e.source === lastVarNodeId && e.target === endId
                );
                if (edgeIndex !== -1) edges.value.splice(edgeIndex, 1);

                edges.value.push(
                    { id: `e-${lastVarNodeId}-${operationNode.id}`, source: lastVarNodeId, target: operationNode.id },
                    { id: `e-${operationNode.id}-${endId}`, source: operationNode.id, target: endId }
                );
            }
        });
    } else {
        connectVariablesToOperation(vars, operationNode, nodes, edges, inferredEndConditionNodeId);
    }
}

function connectVariablesToOperation(
    vars: VariableEntry[],
    operationNode: Node,
    nodes: Ref<Node[]>,
    edges: Ref<Edge[]>,
    inferredEndConditionNodeId: string,
    loopNodePairs?: { loopNodeId: string; endId: string }[],
) {
    const variableNodes = nodes.value.filter(n => n.type === 'define_variable');

    const involvedVars = variableNodes.filter(n =>
        vars.some(v => v.operation?.includes(n.data?.name))
    );

    if (involvedVars.length > 0) {
        const lastVar = involvedVars[involvedVars.length - 1];
        edges.value.push({
            id: `e-${lastVar.id}-${operationNode.id}`,
            source: lastVar.id,
            target: operationNode.id,
        });
        const edgeIndex = edges.value.findIndex(
            e => e.source === lastVar.id && e.target === inferredEndConditionNodeId
        );
        if (edgeIndex !== -1) {
            edges.value.splice(edgeIndex, 1);
        }
        edges.value.push({
            id: `e-${operationNode.id}-${inferredEndConditionNodeId}`,
            source: operationNode.id,
            target: inferredEndConditionNodeId,
        });
    }
    if (loopNodePairs && loopNodePairs.length > 0) {
        loopNodePairs.forEach(({ loopNodeId, endId }) => {
            const edgeIndex = edges.value.findIndex(
                e => e.source === loopNodeId && e.target === endId
            );
            if (edgeIndex !== -1) {
                edges.value.splice(edgeIndex, 1);
            }

            edges.value.push({
                id: `e-${loopNodeId}-${operationNode.id}`,
                source: loopNodeId,
                target: operationNode.id,
            });

            edges.value.push({
                id: `e-${operationNode.id}-${endId}`,
                source: operationNode.id,
                target: endId,
            });
        });
    }
}

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

    const firstNewNode = newNodes[0];
    const lastNewNode = newNodes[newNodes.length - 1];

    if (loopNodePairs?.length) {
        loopNodePairs.forEach(({ loopNodeId, endId }) => {
            reconnectLoopEdges(edges, newNodes, loopNodeId, endId);
        });
    }

    if (parentBranchId && inferredEndConditionNodeId) {
        reconnectToEndCondition(edges, newNodes, parentBranchId, inferredEndConditionNodeId, loopNodePairs);
    } else if (nodes.value.length > 1 && !parentBranchId && !inferredEndConditionNodeId) {
        connectToPreviousNode(nodes, edges, newNodes);
    }

    connectNewNodesSequentially(edges, newNodes);

    // Nettoyage des arêtes inutiles
    edges.value = edges.value.filter(e => !e.source.startsWith('end-loop'));

    return newNodes;
}

// function connectVariablesToOperation(
//     vars: VariableEntry[],
//     operationNode: Node,
//     nodes: Ref<Node[]>,
//     edges: Ref<Edge[]>,
//     inferredEndConditionNodeId: string,
//     loopNodePairs?: { loopNodeId: string; endId: string }[],

// ) {
//     const variableNodes = nodes.value.filter(n => n.type === 'define_variable');

//     const involvedVars = variableNodes.filter(n =>
//         vars.some(v => v.operation?.includes(n.data?.name))
//     );

//     if (involvedVars.length > 0) {

//         const lastVar = involvedVars[involvedVars.length - 1];
//         edges.value.push({
//             id: `e-${lastVar.id}-${operationNode.id}`,
//             source: lastVar.id,
//             target: operationNode.id,
//         });
//         const edgeIndex = edges.value.findIndex(
//             e => e.source === lastVar.id && e.target === inferredEndConditionNodeId
//         );
//         if (edgeIndex !== -1) {
//             edges.value.splice(edgeIndex, 1);
//         }
//         edges.value.push({
//             id: `e-${operationNode.id}-${inferredEndConditionNodeId}`,
//             source: operationNode.id,
//             target: inferredEndConditionNodeId,
//         });
//     }
//     if (loopNodePairs && loopNodePairs.length > 0) {
//         loopNodePairs.forEach(({ loopNodeId, endId }) => {
//             // Supprimer l’arête directe loop → end
//             const edgeIndex = edges.value.findIndex(
//                 e => e.source === loopNodeId && e.target === endId
//             );
//             if (edgeIndex !== -1) {
//                 edges.value.splice(edgeIndex, 1);
//             }

//             // Ajouter arête loop → opération
//             edges.value.push({
//                 id: `e-${loopNodeId}-${operationNode.id}`,
//                 source: loopNodeId,
//                 target: operationNode.id,
//             });

//             // Ajouter arête opération → end
//             edges.value.push({
//                 id: `e-${operationNode.id}-${endId}`,
//                 source: operationNode.id,
//                 target: endId,
//             });
//         });
//     }

// }

// export function onVariablesUpdate(
//     newVariables: VariableEntry | VariableEntry[],
//     type: 'variable' | 'operation',
//     nodes: Ref<Node[]>,
//     edges: Ref<Edge[]>,
//     formVariables: Ref<VariableEntry[]>,
//     inferredEndConditionNodeId: string,
//     parentBranchId?: string,
//     loopNodePairs?: { loopNodeId: string; endId: string }[],

// ) {

//     const vars = Array.isArray(newVariables) ? newVariables : [newVariables]
//     console.log(vars)
//     if (type === 'variable') {
//         const newUniqueVars = vars.filter(v => !formVariables.value.some(existing => existing.name === v.name))
//         if (newUniqueVars.length === 0) return []

//         formVariables.value.push(...newUniqueVars)

//         const startIndex = nodes.value.length
//         const newNodes = generateVariableNodes(newUniqueVars, startIndex)

//         nodes.value.push(...newNodes)
//         if (newNodes.length > 0) {
//             if (loopNodePairs) {

//                 loopNodePairs.forEach(({ loopNodeId, endId }) => {
//                     const firstNewNode = newNodes[0];
//                     const lastNewNode = newNodes[newNodes.length - 1];
//                     console.log(firstNewNode, "firstNode");

//                     // Trouver le nœud actuellement connecté à endId
//                     const edgeToEnd = edges.value.find(e =>
//                         e.target === endId && (e.source.startsWith('var-') || e.source === loopNodeId)
//                     );
//                     const previousNodeId = edgeToEnd?.source;

//                     // Supprimer l’arête précédente vers endId
//                     if (previousNodeId) {
//                         const edgeIndex = edges.value.findIndex(
//                             e => e.source === previousNodeId && e.target === endId
//                         );
//                         if (edgeIndex !== -1) {
//                             edges.value.splice(edgeIndex, 1);
//                         }

//                         // Ajouter arête previousNode → première nouvelle variable
//                         if (!previousNodeId.startsWith('end-loop')) {
//                             edges.value.push({
//                                 id: `e-${previousNodeId}-${firstNewNode.id}`,
//                                 source: previousNodeId,
//                                 target: firstNewNode.id,
//                             });
//                         }
//                     }

//                     // Connecter les nouvelles variables entre elles
//                     for (let i = 0; i < newNodes.length - 1; i++) {
//                         edges.value.push({
//                             id: `e-${newNodes[i].id}-${newNodes[i + 1].id}`,
//                             source: newNodes[i].id,
//                             target: newNodes[i + 1].id,
//                         });
//                     }

//                     // Ajouter arête dernière nouvelle variable → EndCondition
//                     edges.value.push({
//                         id: `e-${lastNewNode.id}-${endId}`,
//                         source: lastNewNode.id,
//                         target: endId,
//                     });
//                     console.log(edges.value)
//                     console.log("previousNodeId:", previousNodeId);
//                     console.log("endId:", endId);
//                 });
//             }
//             const lastEdge = edges?.value[edges?.value.length - 1];
//             console.log(lastEdge);
//             if (parentBranchId && inferredEndConditionNodeId) {
//                 const firstNewNode = newNodes[0];

//                 // Trouver le dernier nœud connecté à la condition de fin
//                 const lastConnectedNodeId = [...edges.value]
//                     .reverse()
//                     .find(e => e.target === inferredEndConditionNodeId)?.source;
//                 console.log(lastConnectedNodeId)
//                 console.log(parentBranchId)
//                 console.log(inferredEndConditionNodeId)
//                 const dynamicParentId = lastConnectedNodeId ?? parentBranchId;
//                 console.log(dynamicParentId);

//                 // Supprimer l’arête dynamicParentId → EndCondition
//                 const edgeIndex = edges.value.findIndex(
//                     e => e.source === dynamicParentId && e.target === inferredEndConditionNodeId
//                 );
//                 if (edgeIndex !== -1) {
//                     edges.value.splice(edgeIndex, 1);
//                 }
//                 console.log(inferredEndConditionNodeId)

//                 // Ajouter arête dynamicParentId → nouveau nœud
//                 edges.value.push({
//                     id: `e-${dynamicParentId}-${firstNewNode.id}`,
//                     source: dynamicParentId!,
//                     target: firstNewNode.id,
//                 });
//                 if (!loopNodePairs) {
//                     console.log("ok");

//                     // Ajouter arête nouveau nœud → EndCondition
//                     edges.value.push({
//                         id: `e-${firstNewNode.id}-${inferredEndConditionNodeId}`,
//                         source: firstNewNode.id,
//                         target: inferredEndConditionNodeId,
//                     });
//                 } else if (loopNodePairs && loopNodePairs.length > 0) {
//                     console.log("okay oui");

//                     const loopEndId = loopNodePairs.find(e => e.endId)?.endId;
//                     console.log(loopEndId);
//                     console.log(inferredEndConditionNodeId);

//                     edges.value.push({
//                         id: `e-${loopEndId}-${inferredEndConditionNodeId}`,
//                         source: loopEndId!,
//                         target: inferredEndConditionNodeId,
//                     });
//                     console.log(edges.value);

//                 }
//                 console.log(edges.value);
//                 console.log(loopNodePairs);

//             }

//             else if (nodes.value.length > 1 && !parentBranchId && !inferredEndConditionNodeId) {
//                 const previousNode = nodes.value[nodes.value.length - newNodes.length - 1]
//                 const firstNewNode = newNodes[0]

//                 const edge: Edge = {
//                     id: `e-${previousNode.id}-${firstNewNode.id}`,
//                     source: previousNode.id,
//                     target: firstNewNode.id,
//                 }
//                 edges.value.push(edge)

//             }
//         }
//         for (let i = 0; i < newNodes.length - 1; i++) {
//             const edge: Edge = {
//                 id: `e-${newNodes[i].id}-${newNodes[i + 1].id}`,
//                 source: newNodes[i].id,
//                 target: newNodes[i + 1].id,
//             }
//             edges.value.push(edge)

//         }
//         edges.value = edges.value.filter(e => !e.source.startsWith('end-loop'));

//         return newNodes;
//     }
//     if (type === 'operation') {
//         const label = vars.map((v: any) => v?.name).join(' + ');
//         const operation = vars.map((v: any) => v?.operation).join(' + ');
//         const operationLabel = `Opération: ${label} = ${operation}`;

//         const existingOperation = nodes.value.find(
//             n => n.type === 'operation' && n.data?.label === operationLabel
//         );

//         if (existingOperation) return;

//         const operationNode: Node = {
//             id: `op-${Date.now()}`,
//             type: "operation",
//             position: { x: 300, y: 300 },
//             data: { label: operationLabel },
//             connectable: true,
//         };

//         nodes.value.push(operationNode);

//         // 🔁 Cas boucle avec opération
//         if (loopNodePairs?.length) {
//             loopNodePairs.forEach(({ endId }) => {
//                 // Trouver la dernière variable connectée à endId
//                 const edgeToEnd = edges.value.find(e =>
//                     e.target === endId && e.source.startsWith('var-')
//                 );
//                 const lastVarNodeId = edgeToEnd?.source;

//                 if (lastVarNodeId) {
//                     // Supprimer l’arête lastVar → endId
//                     const edgeIndex = edges.value.findIndex(
//                         e => e.source === lastVarNodeId && e.target === endId
//                     );
//                     if (edgeIndex !== -1) {
//                         edges.value.splice(edgeIndex, 1);
//                     }

//                     // Ajouter arête lastVar → opération
//                     edges.value.push({
//                         id: `e-${lastVarNodeId}-${operationNode.id}`,
//                         source: lastVarNodeId,
//                         target: operationNode.id,
//                     });

//                     // Ajouter arête opération → endId
//                     edges.value.push({
//                         id: `e-${operationNode.id}-${endId}`,
//                         source: operationNode.id,
//                         target: endId,
//                     });
//                 }
//             });
//         } else {
//             connectVariablesToOperation(vars, operationNode, nodes, edges, inferredEndConditionNodeId);
//         }

//         return [];
//     }

//     return [];
// }
