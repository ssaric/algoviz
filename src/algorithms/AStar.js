/* eslint-disable no-param-reassign */

class GridNode {
    constructor(htmlNode) {
        this.htmlNode = htmlNode;
    }

    visit() {
        this.htmlNode.classList.add('cell--visited');
    }

    discover() {
        this.htmlNode.classList.add('cell--discovered');
    }

    isEndNode() {
        return this.htmlNode.classList.contains('cell--end');
    }

    isVisited() {
        return this.htmlNode.classList.contains('cell--visited');
    }

    isWall() {
        return this.htmlNode.classList.contains('cell--wall');
    }

    markFinalPath() {
        this.htmlNode.classList.add('cell--path');
    }

    get id() {
        return this.htmlNode.id;
    }

    set parent(parent) {
        this.p = parent;
    }

    get parent() {
        return this.p;
    }

    set htmlNode(node) {
        this.node = node;
    }

    get htmlNode() {
        return this.node;
    }

    get location() {
        const nodeLocation = this.htmlNode.dataset.cellLocation.split('-');
        return [parseInt(nodeLocation[0], 10), parseInt(nodeLocation[1], 10)];
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
}

function distance(node, end) {
    const cellStartLocation = node.dataset.cellLocation.split('-');
    const cellEndLocation = end.dataset.cellLocation.split('-');
    return 100 * (Math.abs((cellEndLocation[0] - cellStartLocation[0])) + Math.abs((cellEndLocation[1] - cellStartLocation[1])));
}

function isLocationValid(location, grid) {
    const height = grid.childNodes.length;
    const width = grid.childNodes[0].childNodes.length;
    if (location[0] < 0 || location[0] > height - 1 || location[1] < 0 || location[1] > width - 1) return false;

    const node = grid.childNodes[location[0]].childNodes[location[1]];
    return !node.classList.contains('cell--wall') && !node.classList.contains('cell--visited');
}

function getNode(location, grid) {
    return grid.childNodes[location[0]].childNodes[location[1]];
}

function adjacentNodes(node, grid) {
    const nodeLocation = node.location;
    const nodes = [];

    const up = [nodeLocation[0] - 1, nodeLocation[1]];
    const bottom = [nodeLocation[0] + 1, nodeLocation[1]];
    const right = [nodeLocation[0], nodeLocation[1] + 1];
    const left = [nodeLocation[0], nodeLocation[1] - 1];

    if (isLocationValid(up, grid)) nodes.push(new GridNode(getNode(up, grid)));
    if (isLocationValid(bottom, grid)) nodes.push(new GridNode(getNode(bottom, grid)));
    if (isLocationValid(right, grid)) nodes.push(new GridNode(getNode(right, grid)));
    if (isLocationValid(left, grid)) nodes.push(new GridNode(getNode(left, grid)));

    return nodes;
}

function setNodeParameters(fromNode, node, end) {
    node.g = fromNode.g + 1;
    node.h = distance(node.htmlNode, end);
    node.discover();
    node.parent = fromNode;

    return node;
}

function setStartNodeParameters(node, end) {
    const gridNode = new GridNode(node);
    gridNode.gCost = 0;
    gridNode.hCost = distance(node, end);
    return gridNode;
}


function processNeighbours(node, neighbours, open, end) {
    neighbours.forEach(neighbour => {
        setNodeParameters(node, neighbour, end);
        const existingNode = open.find(n => n.id === neighbour.id);
        if (existingNode && neighbour.g > existingNode.g) {
            return;
        }
        open.push(neighbour);
    });
}

function markPath(endNode) {
    let backtrackNode = endNode;
    while (backtrackNode.parent !== undefined) {
        backtrackNode.markFinalPath();
        backtrackNode = backtrackNode.parent;
    }
    backtrackNode.markFinalPath();
}

function throttledFunction(open, end, grid) {
    const throttleTime = 10;

    const currentNode = open.pop();

    currentNode.visit();
    if (currentNode.isEndNode()) {
        markPath(currentNode);
        return;
    }
    const neighbours = adjacentNodes(currentNode, grid);
    processNeighbours(currentNode, neighbours, open, end);
    open.sort((a, b) => {
        const costDiff = a.totalCost - b.totalCost;
        if (costDiff === 0) {
            return a.hCost - b.hCost;
        }
        return costDiff;
    });
    if (open.length !== 0) {
        setTimeout(throttledFunction, throttleTime, open, end, grid);
    }
}


export default function main(rootNode) {
    const grid = rootNode;
    const start = grid.getElementsByClassName('cell--start')[0];
    const end = grid.getElementsByClassName('cell--end')[0];

    const startNode = setStartNodeParameters(start, end);

    const open = [startNode];
    while(open.length > 0) {
        const currentNode = open.pop();

        currentNode.visit();
        if (currentNode.isEndNode()) {
            markPath(currentNode);
            return;
        }
        const neighbours = adjacentNodes(currentNode, grid);
        processNeighbours(currentNode, neighbours, open, end);
        open.sort((a, b) => {
            const costDiff = a.totalCost - b.totalCost;
            if (costDiff === 0) {
                return a.hCost - b.hCost;
            }
            return costDiff;
        });
        if (open.length !== 0) {
            setTimeout(throttledFunction, throttleTime, open, end, grid);
        }
    }
    throttledFunction(open, end, grid);
}
