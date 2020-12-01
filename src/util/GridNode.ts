import Grid from "./Grid";

export type ArrayLikeCoordinates = [number, number];

export class GridCoordinates {
    public x: number;
    public y: number;
    constructor(x: number, y:number) {
        this.x = x;
        this.y = y;
    }

    get id() {
        return `${this.x},${this.y}`;
    }

    toArray(): ArrayLikeCoordinates {
        return [this.x, this.y];
    }

    public equals(node: GridCoordinates): boolean {
        if (node instanceof GridCoordinates) {
            return this.x === node.x && this.y === node.y;
        } else if (Array.isArray(node)) {
            return this.x === node[0] && this.y === node[1];
        }
        return false;
    }
}

class GridNode {
    public readonly coordinates: GridCoordinates;
    public g: number;
    public h: number;
    public p: GridNode | null;

    constructor(gridLocation: GridCoordinates) {
        this.coordinates = gridLocation;
        this.g = 0;
        this.h = 0;
        this.p = null;
    }

    get id() {
        return this.coordinates.id;
    }

    set parent(parent: GridNode | null) {
        this.p = parent;
    }

    get parent(): GridNode | null  {
        return this.p;
    }

    set gCost(g) {
        this.g = g;
    }

    get gCost(): number {
        return this.g;
    }

    set hCost(h) {
        this.h = h;
    }

    get hCost(): number {
        return this.h;
    }

    get totalCost(): number {
        return this.h + this.g;
    }

    toArray(): [number, number] {
        return this.coordinates.toArray();
    }

    equals(node: GridNode): boolean {
        return node.coordinates.equals(this.coordinates);
    }

    setParameters(endNode: GridNode, fromNode: GridNode) {
        const initialCost: number = (fromNode && fromNode.g) || 0;
        this.g = initialCost + 1;
        this.h = Grid.heuristicsFunction(this.coordinates, endNode.coordinates);
        this.setParent(fromNode);
    }

    setParent(fromNode: GridNode) {
        if (fromNode) {
            this.parent = fromNode;
        }
    }
}

export default GridNode;
