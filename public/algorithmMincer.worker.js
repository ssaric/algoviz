/* eslint-disable no-param-reassign */

function heuristics(nodeA, nodeB) {
    return 100 * (Math.abs((nodeA.x - nodeB.x)) + (Math.abs((nodeA.y - nodeB.y))));
}

class GridNode {
    constructor([x, y]) {
        this.x = x;
        this.y = y;
        this.g = 0;
        this.h = 0;
    }

    get id() {
        return `${this.x},${this.y}`;
    }

    set parent(parent) {
        this.p = parent;
    }

    get parent() {
        return this.p;
    }

    set gCost(g) {
        this.g = g;
    }

    get gCost() {
        return this.g;
    }

    set hCost(h) {
        this.h = h;
    }

    get hCost() {
        return this.h;
    }

    get totalCost() {
        return this.h + this.g;
    }

    toArray() {
        return [this.x, this.y];
    }

    equals(node) {
        if (node instanceof GridNode) {
            return this.x === node.x && this.y === node.y;
        } else if (Array.isArray(node)) {
            return this.x === node.x && this.y === node.y;
        }
    }

    setParameters(endNode, fromNode) {
        const initialCost = (fromNode && fromNode.g) || 0;
        this.g = initialCost + 1;
        this.h = heuristics(this, endNode);
        this.setParent(fromNode);
    }

    setParent(fromNode) {
        if (fromNode) {
            this.parent = fromNode;
        }
    }
}


function isLocationValid(location, grid) {
    const height = grid.height;
    const width = grid.width;
    if (location[0] < 0 || location[0] > height - 1 || location[1] < 0 || location[1] > width - 1) return false;
    return !grid.isWall(location) && !grid.isVisited(location);
}

function adjacentNodes(node, grid) {
    const nodes = [];

    const up = [node.x - 1, node.y];
    const bottom = [node.x + 1, node.y];
    const right = [node.x, node.y + 1];
    const left = [node.x, node.y - 1];

    if (isLocationValid(up, grid)) nodes.push(new GridNode(up));
    if (isLocationValid(bottom, grid)) nodes.push(new GridNode(bottom));
    if (isLocationValid(right, grid)) nodes.push(new GridNode(right));
    if (isLocationValid(left, grid)) nodes.push(new GridNode(left));

    return nodes;
}

function processNeighbours(node, neighbours, open, end, grid) {
    neighbours.forEach(neighbour => {
        neighbour.setParameters(end, node);
        const existingNode = open.find(n => n.id === neighbour.id);
        if (existingNode && neighbour.g > existingNode.g) {
            return;
        } else if (existingNode) {
            open.splice(open.indexOf(existingNode), 1);
        }
        grid.discover(neighbour);
        open.push(neighbour);
    });
}

function markPath(endNode) {
    let backtrackNode = endNode;
    while (backtrackNode.parent !== undefined) {
        sendStep(createMarkPathStep(backtrackNode));
        backtrackNode = backtrackNode.parent;
    }
    sendStep(createMarkPathStep(backtrackNode));
}

function sendStep(step) {
    this.postMessage([MessageTypes.ALGORITHM_STEP, step]);
}

function createStartStep() {
    return {
        type: 'start',
    }
}

function createMarkPathStep(node) {
    return {
        type: 'markPath',
        location: node.toArray(),
    }
}

function createEndStep(node) {
    return {
        type: 'end',
        location: node.toArray(),
    }
}

function createVisitStep(node) {
    return {
        type: 'visit',
        location: node.toArray(),
    }
}

function createDiscoverStep(node) {
    return {
        type: 'discover',
        location: node.toArray(),
    }
}

function process(grid) {
    const startNode = grid.start;
    const endNode = grid.end;
    const open = [startNode];
    sendStep(createStartStep());
    while(open.length > 0) {
        const currentNode = open.pop();
        grid.visit(currentNode);
        if (grid.isEndNode(currentNode)) {
            sendStep(createEndStep(currentNode));
            markPath(currentNode);
            return;
        }
        const neighbours = adjacentNodes(currentNode, grid);
        processNeighbours(currentNode, neighbours, open, endNode, grid);
        open.sort((a, b) => {
            const costDiff = b.totalCost - a.totalCost;
            if (costDiff === 0) {
                return b.hCost - a.hCost;
            }
            return costDiff;
        });
    }
}

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


    serialize() {
        return {
            width: this.width,
            height: this.height,
            start: this.start,
            end: this.end,
            walls: this.walls
        }
    }

    visit(node) {
        this.visited.set(node.id, node);
        sendStep(createVisitStep(node));
    }

    discover(node) {
        this.discovered.set(node.id, node);
        sendStep(createDiscoverStep(node));
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

const MessageTypes = {
    GRID_DATA: 0,
    ALGORITHM_STEP: 0,
}


onmessage = function(e) {
    switch (e.data[0]) {
        case MessageTypes.GRID_DATA: {
            const grid = new Grid(e.data[1]);
            process(grid);
        }
    }
}
