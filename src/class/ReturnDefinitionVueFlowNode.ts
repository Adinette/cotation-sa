import { useNodesStore } from "@/stores/nodesStore";
import type { HandleConnectable, Node, Position } from "@vue-flow/core";

export interface ReturnDefinitionNodeData extends Node { }

export class ReturnDefinitionVueFlowNode implements Node {
    id: string
    type: string
    position: { x: number; y: number }
    sourcePosition?: Position | undefined;
    targetPosition?: Position | undefined;
    data?: {
        label: string
        name: string
    }

    connectable: HandleConnectable | undefined

    constructor(data: ReturnDefinitionNodeData) {
        this.id = data.id
        this.type = "return"
        this.data = data.data
        this.position = data.position
        this.sourcePosition = data.sourcePosition
        this.targetPosition = data.targetPosition
        this.connectable = data.connectable
    }

    get numberOfEdgesAuthorized() {
        return 1
    }

    get node(): Node {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            sourcePosition: this.sourcePosition,
            targetPosition: this.targetPosition,
            connectable: this.connectable,
            data: {
                label: this.data?.label ?? '',
                name: this.data?.name ?? ''
            }

        }
    }

    canAddEdge(): boolean {
        const store = useNodesStore()
        return store.canAddEdge(this.id, this.numberOfEdgesAuthorized)
    }
}
