import GridNode, {GridCoordinates} from './GridNode';
import {GridConstructorData, Heuristics, HeuristicsData} from "../constants/types";
import { evaluate } from "mathjs";


export interface HeuristicsFunction {
    (nodeA: GridCoordinates, nodeB: GridCoordinates): number;
}


function manhattanHeuristics(nodeA: GridCoordinates, nodeB: GridCoordinates) {
    return (Math.abs(nodeA.x - nodeB.x) + (Math.abs(nodeA.y - nodeB.y)));
}
function euclideanHeuristics(nodeA: GridCoordinates, nodeB: GridCoordinates) {
    return ((nodeA.x - nodeB.x)**2 + (nodeA.y - nodeB.y)**2);
}

const customHeuristics = (formula) => (nodeA: GridCoordinates, nodeB: GridCoordinates) => {
    const scope = {
        x: nodeA.x - nodeB.x,
        y: nodeA.y - nodeB.y,
    };
    return evaluate(formula, scope);
}


export function setHeuristicsFunction(heuristicsData: HeuristicsData) {
    switch (heuristicsData.type) {
        default:
        case Heuristics.EUCLIDEAN:
            Grid.heuristicsFunction = euclideanHeuristics;
            break;
        case Heuristics.MANHATTAN:
            Grid.heuristicsFunction = manhattanHeuristics;
            break;
        case Heuristics.CUSTOM:
            Grid.heuristicsFunction = customHeuristics(heuristicsData.formula);
            break;

    }
}

class Grid {
    private readonly width: number;
    private readonly height: number;
    public readonly start: GridNode;
    public readonly end: GridNode;
    private walls: Map<string, GridNode>;
    private visited: Map<string, GridNode>;
    private discovered: Map<string, GridNode>;
    public static heuristicsFunction;

    constructor({width, height, start, end, walls}: GridConstructorData) {
        this.width = width;
        this.height = height;
        this.start = new GridNode(start);
        this.end = new GridNode(end);
        this.walls = new Map();
        this.visited = new Map();
        this.discovered = new Map();
        walls.forEach((w: GridCoordinates) => this.walls.set(w.id, new GridNode(w)));
    }

    visit(node: GridNode) {
        this.visited.set(node.id, node);
    }

    discover(node: GridNode) {
        this.discovered.set(node.id, node);
    }

    isEndNode(node: GridNode): boolean {
        return node.equals(this.end);
    }

    isVisited(gridLocation: GridCoordinates): boolean {
        return this.visited.has(gridLocation.id);
    }

    isWall(gridLocation): boolean {
        return this.walls.has(gridLocation.id);
    }

    public isCellWalkable(location: GridCoordinates): boolean {
        return this.isLocationValid(location) && !this.isWall(location) && !this.isVisited(location);
    }


    isLocationValid(location: GridCoordinates) {
        return !(location.x < 0 || location.x > this.height - 1 || location.y < 0 || location.y > this.width - 1);
    }

    public adjacentNodes(node: GridNode) {
        const nodes: Array<GridNode> = [];

        const up = new GridCoordinates(node.coordinates.x - 1, node.coordinates.y);
        const bottom = new GridCoordinates(node.coordinates.x + 1, node.coordinates.y);
        const right = new GridCoordinates(node.coordinates.x, node.coordinates.y + 1);
        const left = new GridCoordinates(node.coordinates.x, node.coordinates.y - 1);

        if (this.isCellWalkable(up)) nodes.push(new GridNode(up));
        if (this.isCellWalkable(bottom)) nodes.push(new GridNode(bottom));
        if (this.isCellWalkable(right)) nodes.push(new GridNode(right));
        if (this.isCellWalkable(left)) nodes.push(new GridNode(left));

        return nodes;
    }
}

export default Grid;
