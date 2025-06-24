import { useNodesStore } from "@/stores/nodesStore";
import type { HandleConnectable, Node, Position } from "@vue-flow/core";

export interface ConditionDefinitionNodeData extends Node { }

export class ConditionDefinitionVueFlowNode implements Node {
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

    constructor(data: ConditionDefinitionNodeData) {
        this.id = data.id
        this.type = "condition"
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

export class ThenNode implements Node {
    id: string
    type: string
    position: { x: number; y: number }
    sourcePosition?: Position
    targetPosition?: Position
    data?: { label: string }
    connectable: boolean | undefined

    constructor(id: string, position: { x: number; y: number }, label = 'Alors (Then)') {
        this.id = id
        this.type = 'then'
        this.position = position
        this.data = { label }
        this.connectable = true
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
            data: this.data,
        }
    }
    canAddEdge(): boolean {
        const store = useNodesStore()
        return store.canAddEdge(this.id, this.numberOfEdgesAuthorized)
    }
}

export class ElseNode implements Node {
    id: string
    type: string
    position: { x: number; y: number }
    sourcePosition?: Position
    targetPosition?: Position
    data?: { label: string }
    connectable: boolean | undefined

    constructor(id: string, position: { x: number; y: number }, label = 'Sinon (Else)') {
        this.id = id
        this.type = 'else'
        this.position = position
        this.data = { label }
        this.connectable = true
    }
    get numberOfEdgesAuthorized() {
        return 2
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
    canAddEdge(): boolean {
        const store = useNodesStore()
        return store.canAddEdge(this.id, this.numberOfEdgesAuthorized)
    }
}

export class ContinueNode implements Node {
    id: string
    type: string
    position: { x: number; y: number }
    sourcePosition?: Position
    targetPosition?: Position
    data?: { label: string }
    connectable: boolean | undefined

    constructor(id: string, position: { x: number; y: number }, label = 'Continuer une itération') {
        this.id = id
        this.type = 'condition'
        this.position = position
        this.data = { label }
        this.connectable = true
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
            data: this.data,
        }
    }
    canAddEdge(): boolean {
        const store = useNodesStore()
        return store.canAddEdge(this.id, this.numberOfEdgesAuthorized)
    }
}

export class BreakNode implements Node {
    id: string
    type: string
    position: { x: number; y: number }
    sourcePosition?: Position
    targetPosition?: Position
    data?: { label: string }
    connectable: boolean | undefined

    constructor(id: string, position: { x: number; y: number }, label = 'Arreter une itération') {
        this.id = id
        this.type = 'condition'
        this.position = position
        this.data = { label }
        this.connectable = true
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
            data: this.data,
        }
    }
    canAddEdge(): boolean {
        const store = useNodesStore()
        return store.canAddEdge(this.id, this.numberOfEdgesAuthorized)
    }
}

export class EndConditionNode implements Node {
    id: string
    type: string
    position: { x: number; y: number }
    sourcePosition?: Position
    targetPosition?: Position
    data?: { label: string }
    connectable: boolean | undefined

    constructor(id: string, position: { x: number; y: number }, label = 'Fin de condition') {
        this.id = id
        this.type = 'end-condition'
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
