

export const selectedParentId = ref<string | null>(null)

export function updateHeight(nodes: any[], NodeId: string) {
    const NodeIndex = nodes.findIndex(n => n.id === NodeId);
    if (NodeIndex === -1) return;

    const ChildCount = nodes.filter(n => n.parentNode === NodeId).length;
    const baseHeight = 300;
    const heightPerChild = 150;
    const newHeight = baseHeight + ChildCount * heightPerChild;

    nodes[NodeIndex].style.height = `${newHeight}px`;
}


