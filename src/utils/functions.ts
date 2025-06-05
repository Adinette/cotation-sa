import { Node } from '@vue-flow/core';

export const selectedParentId = ref<string | null>(null)

function getNodeStyleValue<T extends string>(
    node: Node,
    key: T,
    fallback: number
): number {
    const style = node.style;

    if (typeof style === 'function') {
        return fallback;
    }

    const value = style?.[key];

    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? fallback : parsed;
    }

    if (typeof value === 'number') {
        return value;
    }

    return fallback;
}



export function updateHeight(nodes: any[], NodeId: string) {
    const NodeIndex = nodes.findIndex(n => n.id === NodeId);
    if (NodeIndex === -1) return;

    const ChildCount = nodes.filter(n => n.parentNode === NodeId).length;
    const baseHeight = 300;
    const heightPerChild = 300;
    const newHeight = baseHeight + ChildCount * heightPerChild;

    nodes[NodeIndex].style.height = `${newHeight}px`;
}

export function computeNodeHeightWithChildren(node: Node, allNodes: Node[]): number {
    const children = allNodes.filter((n) => n.parentNode === node.id);

    if (!children.length) return getNodeStyleValue(node, 'height', 100);

    const childHeights = children.map((child) => {
        const height = getNodeStyleValue(child, 'height', 100);
        return height + 20;
    });

    return childHeights.reduce((sum, h) => sum + h, 0);
}


export function computeNodeWidthWithChildren(nodeLabel: string, children?: Node[]): number {
    const avgCharWidth = 16;
    const padding = 20;
    const minWidth = 400;
    const maxWidth = 1000;

    const labelWidth = nodeLabel.length * avgCharWidth + padding;

    const childrenWidths = children?.map(child => {
        return getNodeStyleValue(child, 'width', 100);
    }) ?? [];

    const maxChildWidth = childrenWidths.length > 0 ? Math.max(...childrenWidths) : 0;

    return Math.max(minWidth, Math.min(maxWidth, Math.max(labelWidth, maxChildWidth)));
}

