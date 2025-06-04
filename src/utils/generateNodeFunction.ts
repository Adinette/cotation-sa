import { Node } from '@vue-flow/core';
import { BlocType } from './type';

let Count = 0;

export function createChildNode(
    parentId: string,
    label: string,
    type: BlocType,
    style: Partial<Node['style']> = {}
): Node {
    return {
        id: `${parentId}-child-${Count++}`,
        type: type.toLowerCase(),
        position: { x: 10, y: 50 },
        parentNode: parentId,
        extent: 'parent',
        style: {
            backgroundColor: '#fff',
            width: '150px',
            height: '40px',
            padding: '10px',
            ...style
        },
        data: { label, type },
    };
}

export function createConditionContainer(id: string, label: string, parentId?: string): Node[] {
    const conditionNode: Node = {
        id,
        type: 'condition',
        position: { x: 100, y: 100 },
        parentNode: parentId,
        extent: parentId ? 'parent' : undefined,
        style: {
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            width: '750px',
            height: '500px',
            padding: '16px'
        },
        data: { label: "Condition" }
    };

    const detailNode = createChildNode(id, label, BlocType.CONDITION);

    const thenNode: Node = {
        id: `${id}-then`,
        type: 'condition',
        position: { x: 10, y: 110 },
        parentNode: id,
        extent: 'parent',
        style: {
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            width: '350px',
            padding: '16px'
        },
        data: {
            label: 'Then',
            type: BlocType.CONDITION,
            onClick: () => handleConditionClick(`${id}-then`, 'Then'),
        },
    };

    const elseNode: Node = {
        id: `${id}-else`,
        type: 'condition',
        position: { x: 330, y: 110 },
        parentNode: id,
        extent: 'parent',
        style: {
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            width: '350px',
            padding: '16px'
        },
        data: {
            label: 'Else',
            type: BlocType.CONDITION,
            onClick: () => {
                selectedElseParentId.value = `${id}-else`;
                window.dispatchEvent(new CustomEvent('open-variable-editor', {
                    detail: { nodeId: `${id}-else`, label: 'Else', isParent: true }
                }));
            }
        }
    };

    return [conditionNode, detailNode, thenNode, elseNode];
}

export function addNestedNode(nodes: Node[], parentId: string, label: string, type: 'variable' | 'operation' | 'return' | 'loop' | 'condition') {
    const nodeList = createThenDetailNode(parentId, label, type);
    nodes.push(...nodeList);
    updateHeight(nodes, parentId);
}

export function createChildNodes(
    baseId: string,
    parentType: 'condition',
    onClickLabel?: string,
): Node[] {
    const firstId = `${baseId}-define-then`;
    const secondId = `${baseId}-define-else`;

    const commonStyle = {
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        width: '400px',
        padding: '16px',
    };

    let firstLabel = '';
    let secondLabel = '';
    let firstType: BlocType = BlocType.CONDITION;
    let secondType: BlocType = BlocType.CONDITION;

    if (parentType === 'condition') {
        firstLabel = 'Then';
        secondLabel = 'Else';
        firstType = BlocType.CONDITION;
        secondType = BlocType.CONDITION;
    } else {
        throw new Error(`Unhandled parentType: ${parentType}`);
    }

    const firstNode: Node = {
        id: firstId,
        type: parentType,
        position: { x: 10, y: 110 },
        parentNode: baseId,
        extent: 'parent',
        style: commonStyle,
        data: {
            label: firstLabel,
            type: firstType,
            ...(onClickLabel ? { onClick: () => handleConditionClick(firstId, onClickLabel) } : {}),
        },
    };

    const secondNode: Node = {
        id: secondId,
        type: parentType,
        position: { x: 370, y: 110 },
        parentNode: baseId,
        extent: 'parent',
        style: commonStyle,
        data: {
            label: secondLabel,
            type: secondType,
        },
    };

    return [firstNode, secondNode];
}

export function createThenDetailNode(
    nodeIdVar: string,
    label: string,
    type: 'variable' | 'condition' | 'operation' | 'return' | 'loop'
): Node[] {
    Count += 1;
    const baseId = `${nodeIdVar}-detail-${Count}`;
    const detailId = `${baseId}-child`;

    const isVariable = type === 'variable' || type === 'operation';
    const isReturn = type === 'return';
    const isCondition = type === 'condition';

    const labelMap = {
        variable: 'Déclaration de variable',
        condition: 'Condition',
        operation: 'Opération',
        return: 'Retour',
        loop: 'Boucle',
    };
    const name = labelMap[type] || 'Inconnu';

    const typeMap = {
        variable: 'define_variable',
        condition: 'condition',
        operation: 'operation',
        return: 'return',
        loop: 'loop',
    };
    const types = typeMap[type] || 'Inconnu';

    function getNodeColor() {
        if (isVariable) return 'rgba(16, 185, 129, 0.5)';
        if (isReturn) return 'rgba(130, 111, 184, 0.5)';
        return 'rgba(139, 92, 246, 0.5)';
    }

    const parentNode: Node = {
        id: baseId,
        type: types,
        parentNode: nodeIdVar,
        extent: 'parent',
        position: { x: 100, y: 100 },
        style: {
            backgroundColor: getNodeColor(),
            width: isVariable ? '300px' : '700px',
            height: isVariable ? '100px' : '250px',
            padding: '16px',
        },
        data: {
            label: name,
        },
    };

    const detailNode: Node = {
        id: detailId,
        type: types,
        position: { x: 10, y: 50 },
        parentNode: baseId,
        extent: 'parent',
        style: {
            backgroundColor: '#fff',
            width: '300px',
            height: '80px',
            padding: '10px',
        },
        data: {
            label,
            type: isVariable ? BlocType.DEFINE_VARIABLE : BlocType.CONDITION,
        },
    };

    const nodes: Node[] = [parentNode, detailNode];

    if (isCondition) {
        nodes.push(...createChildNodes(baseId, 'condition', 'Then'));
    }

    return nodes;
}
