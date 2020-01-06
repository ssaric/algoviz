import GridNode from './GridNode';

class Grid {
    constructor({width, height, start, end, walls}) {
        this.width = width;
        this.height = height;
        this.start = new GridNode(start);
        this.end = new GridNode(end);
        this.walls = new Map();
        this.visited = new Map();
        this.discovered = new Map();
        walls.forEach(w => this.walls.set(String(w), new GridNode(w)));
    }

    visit(node) {
        this.visited.set(node.id, node);
    }

    discover(node) {
        this.discovered.set(node.id, node);
    }

    isEndNode(node) {
        return node.equals(this.end);
    }

    isVisited(node) {
        if (Array.isArray(node)) return this.visited.has(String(node));
        return this.visited.has(node.id);
    }

    isWall(node) {
        if (Array.isArray(node)) return this.walls.has(String(node));
        return this.walls.has(node.id);
    }

}

export default Grid;
