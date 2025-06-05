import { Node } from '@vue-flow/core';
import { BlocType } from './type';

//VARIABLE
export function generateVariableNode(variable: any, nodes: any[], btnType: string) {
    const mainVar = `${variable?.name ?? ''} = ${variable?.operation ?? ''}`
    const nodeId = `var-${mainVar}`
    let label = '';
    let type = '';

    if (btnType === 'variable') {
        label = 'Déclaration de variable';
        type = 'define_variable';
    } else if (btnType === 'operation') {
        label = 'Opération';
        type = 'operation';
    }
    const exists = nodes.some(n => n.id === nodeId)
    if (exists) return

    nodes.push(
        {
            id: nodeId,
            type: type,
            position: { x: 100, y: 100 },
            style: {
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                width: '350px',
                height: '150px',
                padding: '16px'
            },
            data: {
                label: label
            }
        },
        {
            id: `${nodeId}-child`,
            type: 'define_variable_detail',
            position: { x: 10, y: 50 },
            parentNode: nodeId,
            extent: 'parent',
            style: {
                backgroundColor: '#fff',
                width: '300px',
                height: '60px',
                padding: '10px'
            },
            data: {
                label: mainVar,
                type: BlocType.DEFINE_VARIABLE
            }
        }
    )
    return;
}

// RETURN
export function generateReturnNodes(ret: any, nodes: any[]) {
    const mainRet = `${ret?.name}`
    const nodeId = `var-${mainRet}`

    const exists = nodes.some(n => n.id === nodeId)
    if (exists) return;

    nodes.push({
        id: nodeId,
        type: 'return',
        position: { x: 100, y: 100 },
        style: {
            backgroundColor: 'rgba(130, 111, 184, 0.5)',
            width: '350px',
            height: '150px',
            padding: '16px'
        },
        data: {
            label: 'Retour'
        }
    },
        {
            id: `${nodeId}-child`,
            position: { x: 10, y: 50 },
            parentNode: nodeId,
            extent: 'parent',
            style: {
                backgroundColor: '#fff',
                width: '300px',
                height: '60px',
                padding: '10px'
            },
            data: {
                label: `${mainRet}`,
                type: BlocType.RETURN
            }

        })
    return;
};

//LOOP
export function generateLoopNodes(loop: any, nodes: any[]) {
    const mainLoop = `${loop?.tableName}, ${loop?.loopVariable}`
    const nodeId = `loop-${mainLoop}`

    const exists = nodes.some(n => n.id === nodeId)
    if (exists) return nodeId

    nodes.push({
        id: nodeId,
        type: 'loop',
        position: { x: 100, y: 100 },
        style: {
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            width: '500px',
            padding: '16px'
        },
        data: {
            label: `Boucle`,
        }
    },
        {
            id: `${nodeId}-child`,
            type: 'loop',
            position: { x: 10, y: 50 },
            parentNode: nodeId,
            extent: 'parent',
            style: {
                backgroundColor: '#fff',
                width: '300px',
                height: '80px',
                padding: '10px'
            },
            data: {
                label: mainLoop,
                type: BlocType.LOOP
            }
        },
    )
    updateHeight(nodes, nodeId);
    return nodeId;
};

//CONDITIONS
export function generateConditionNode(condition: any, variable: any, ret: any, loop: any, nodes: Node[], allVariables: any[], btnType: string) {
    const mainCond = `${condition.left} ${condition.operation} ${condition.right}`;
    const nodeId = `cond-${mainCond}`;

    const variableLabel = `${variable?.name ?? ''} = ${variable?.operation ?? ''}`;
    const loopLabel = `${loop?.tableName}, ${loop?.loopVariable}`

    if (selectedParentId.value) {
        const parent = selectedParentId.value;
        switch (btnType) {
            case 'variable':
            case 'operation':
                addNestedNode(nodes, parent, variableLabel, btnType);
                return;
            case 'return':
                addNestedNode(nodes, parent, ret.name, 'return');
                return;
            case 'loop':
                addNestedNode(nodes, parent, loopLabel, 'loop');
                return;
            case 'condition':
                addNestedNode(nodes, parent, mainCond, 'condition');
                return;
        }
    }

    let conditionId: string | undefined;

    if (btnType === 'continue' || btnType === 'break') {
        const existingLoop = nodes.find(n =>
            n.type === 'loop' &&
            n.data?.label === "Boucle"
        );

        let loopId: string;

        if (existingLoop) {
            loopId = existingLoop.id;

        } else {
            loopId = generateLoopNodes(loop, nodes);
        }

        conditionId = `${loopId}-condition`;
        const conditionNodes = createConditionContainer(conditionId, mainCond, loopId);
        nodes.push(...conditionNodes);

        updateHeight(nodes, loopId);
    } else if (btnType === 'condition') {
        conditionId = nodeId;
        const conditionNodes = createConditionContainer(conditionId, mainCond);
        nodes.push(...conditionNodes);
        updateHeight(nodes, conditionId);
    }

    if (btnType === 'continue') {
        const thenNodeId = `${conditionId}-then`;
        const continueNode = createChildNode(thenNodeId, 'Continue', BlocType.CONTINUE, {
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
        });
        nodes.push(continueNode);
        updateHeight(nodes, thenNodeId);
    }

    if (btnType === 'break') {
        const thenNodeId = `${conditionId}-then`;
        const breakNode = createChildNode(thenNodeId, 'Arrêter', BlocType.BREAK, {
            backgroundColor: 'rgba(239, 68, 68, 0.3)',
        });
        nodes.push(breakNode);
        updateHeight(nodes, thenNodeId);
    }
}

