import { useNodesStore } from "@/stores/nodesStore";
import type { HandleConnectable, Node, Position } from "@vue-flow/core";

export interface LoopDefinitionNodeData extends Node { }

export class LoopDefinitionVueFlowNode implements Node {
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

    constructor(data: LoopDefinitionNodeData) {
        this.id = data.id
        this.type = "loop"
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

export class EndLoopNode implements Node {
    id: string
    type: string
    position: { x: number; y: number }
    sourcePosition?: Position
    targetPosition?: Position
    data?: { label: string }
    connectable: boolean | undefined

    constructor(id: string, position: { x: number; y: number }, label = 'Fin de boucle') {
        this.id = id
        this.type = 'end-loop'
        this.position = position
        this.data = { label }
        this.connectable = true
    }

    get node(): Node {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            sourcePosition: this.sourcePosition,
            targetPosition: this.targetPosition,
            connectable: this.connectable,
            data: this.data,
        }
    }
}
