import { Node } from '@vue-flow/core';
import { BlocType } from './type';

let count = 0;

const generateId = (prefix: string) => `${prefix}-${count++}`;

const BASE_STYLE = {
    backgroundColor: '#fff',
    width: '250px',
    height: '40px',
    padding: '10px',
};

const getColorByType = (type: BlocType): string => {
    switch (type) {
        case BlocType.DEFINE_VARIABLE:
        case BlocType.OPERATION:
            return 'rgba(16, 185, 129, 0.5)';
        case BlocType.RETURN:
            return 'rgba(130, 111, 184, 0.5)';
        default:
            return 'rgba(139, 92, 246, 0.5)';
    }
};

export function createChildNode(
    parentId: string,
    label: string,
    type: BlocType,
    style: Partial<Node['style']> = {}
): Node {
    return {
        id: generateId(`${parentId}-child`),
        type: type.toLowerCase(),
        position: { x: 10, y: 50 },
        parentNode: parentId,
        extent: 'parent',
        style: { ...BASE_STYLE, ...style },
        data: { label, type },
    };
}

function createThenElseNode(id: string, parentId: string, label: string): Node {
    const parentNodeWidth = computeNodeWidthWithChildren(label, []);
    return {
        id,
        type: 'condition',
        position: { x: label === 'Then' ? 10 : 330, y: 110 },
        parentNode: parentId,
        extent: 'parent',
        style: {
            backgroundColor: getColorByType(BlocType.CONDITION),
            width: `${parentNodeWidth}px`,
            padding: '16px',
        },
        data: {
            label,
            type: BlocType.CONDITION,
            ...(label === 'Then'
                ? { onClick: () => handleConditionClick(id, label) }
                : {
                    onClick: () => {
                        selectedElseParentId.value = id;
                        window.dispatchEvent(new CustomEvent('open-variable-editor', {
                            detail: { nodeId: id, label, isParent: true },
                        }));
                    },
                }),
        },
    };
}

export function createThenDetailNode(
    nodeIdVar: string,
    label: string,
    type: 'variable' | 'condition' | 'operation' | 'return' | 'loop'
): Node[] {
    const blocTypeMap: Record<string, BlocType> = {
        variable: BlocType.DEFINE_VARIABLE,
        operation: BlocType.OPERATION,
        return: BlocType.RETURN,
        condition: BlocType.CONDITION,
        loop: BlocType.LOOP,
    };

    const labelMap: Record<string, string> = {
        variable: 'Déclaration de variable',
        operation: 'Opération',
        return: 'Retour',
        condition: 'Condition',
        loop: 'Boucle',
    };

    const parentType = blocTypeMap[type] ?? BlocType.CONDITION;
    const nodeColor = getColorByType(parentType);
    const baseId = generateId(`${nodeIdVar}-detail`);
    const detailId = `${baseId}-child`;

    const detailNode = createChildNode(baseId, label, parentType);

    const additionalChildren: Node[] =
        type === 'condition' ? createChildNodes(baseId, 'condition', 'Then') : [];

    const allChildren = [detailNode, ...additionalChildren];

    const parentNodeWidth = computeNodeWidthWithChildren(label, allChildren);

    const parentNode: Node = {
        id: baseId,
        type: parentType.toLowerCase(),
        parentNode: nodeIdVar,
        extent: 'parent',
        position: { x: 100, y: 100 },
        style: {
            backgroundColor: nodeColor,
            width: `${parentNodeWidth}px`,
            height:
                type === 'variable' || type === 'operation' || type === 'return'
                    ? '100px'
                    : '250px',
            padding: '16px',
        },
        data: { label: labelMap[type] || 'Bloc', type: parentType },
    };

    return [parentNode, detailNode, ...additionalChildren];
}


export function addNestedNode(
    nodes: Node[],
    parentId: string,
    label: string,
    type: 'variable' | 'condition' | 'operation' | 'return' | 'loop'
) {
    const created = createThenDetailNode(parentId, label, type);
    nodes.push(...created);
    updateHeight(nodes, parentId);
}

export function createConditionContainer(id: string, label: string, parentId?: string): Node[] {
    const detailNode = createChildNode(id, label, BlocType.CONDITION);
    const thenNode = createThenElseNode(`${id}-then`, id, 'Then');
    const elseNode = createThenElseNode(`${id}-else`, id, 'Else');

    const parentNodeWidth = computeNodeWidthWithChildren(label, [detailNode, thenNode, elseNode]);

    const container: Node = {
        id,
        type: 'condition',
        position: { x: 100, y: 100 },
        parentNode: parentId,
        extent: parentId ? 'parent' : undefined,
        style: {
            backgroundColor: getColorByType(BlocType.CONDITION),
            width: `${parentNodeWidth}px`,
            height: '500px',
            padding: '16px',
        },
        data: { label: 'Condition' },
    };

    return [container, detailNode, thenNode, elseNode];
}

export function createChildNodes(
    baseId: string,
    parentType: 'condition',
    onClickLabel?: string
): Node[] {
    const ids = {
        then: `${baseId}-define-then`,
        else: `${baseId}-define-else`,
    };

    const thenLabel = 'Then';
    const elseLabel = 'Else';

    const thenNode: Node = {
        id: ids.then,
        type: parentType,
        position: { x: 10, y: 110 },
        parentNode: baseId,
        extent: 'parent',
        style: {
            backgroundColor: getColorByType(BlocType.CONDITION),
            width: `${computeNodeWidthWithChildren(thenLabel)}px`,
            padding: '16px',
        },
        data: {
            label: thenLabel,
            type: BlocType.CONDITION,
            ...(onClickLabel ? { onClick: () => handleConditionClick(ids.then, onClickLabel) } : {}),
        },
    };

    const elseNode: Node = {
        id: ids.else,
        type: parentType,
        position: { x: 370, y: 110 },
        parentNode: baseId,
        extent: 'parent',
        style: {
            backgroundColor: getColorByType(BlocType.CONDITION),
            width: `${computeNodeWidthWithChildren(elseLabel)}px`,
            padding: '16px',
        },
        data: {
            label: elseLabel,
            type: BlocType.CONDITION,
        },
    };

    return [thenNode, elseNode];
}

