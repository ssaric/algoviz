/* eslint-disable no-param-reassign */

import MessageTypes from './enums/MessageTypes';
import GridNode from './util/GridNode';
import Grid from './util/Grid';
import { isLocationValid } from './util';


function isCellWalkable(location, grid) {
    const height = grid.height;
    const width = grid.width;
    return isLocationValid(location, width, height) && !grid.isWall(location) && !grid.isVisited(location);
}

function adjacentNodes(node, grid) {
    const nodes = [];

    const up = [node.x - 1, node.y];
    const bottom = [node.x + 1, node.y];
    const right = [node.x, node.y + 1];
    const left = [node.x, node.y - 1];

    if (isCellWalkable(up, grid)) nodes.push(new GridNode(up));
    if (isCellWalkable(bottom, grid)) nodes.push(new GridNode(bottom));
    if (isCellWalkable(right, grid)) nodes.push(new GridNode(right));
    if (isCellWalkable(left, grid)) nodes.push(new GridNode(left));

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
        sendStep(createDiscoverStep(neighbour));
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

function createVisitStep(node, neighbours) {
    return {
        type: 'visit',
        neighbours,
        location: node.toArray(),
    }
}

function createDiscoverStep(node) {
    return {
        type: 'discover',
        location: node.toArray(),
    }
}

function sortOpenNodes(open) {
    open.sort((a, b) => {
        const costDiff = b.totalCost - a.totalCost;
        if (costDiff === 0) {
            return b.hCost - a.hCost;
        }
        return costDiff;
    });
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
        sendStep(createVisitStep(currentNode, neighbours));

        processNeighbours(currentNode, neighbours, open, endNode, grid);
        sortOpenNodes(open);
    }
}

onmessage = function(e) {
    switch (e.data[0]) {
        case MessageTypes.GRID_DATA: {
            const grid = new Grid(e.data[1]);
            process(grid);
        }
    }
}
