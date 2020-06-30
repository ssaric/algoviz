/* eslint-disable no-param-reassign */
import Grid, {setHeuristicsFunction} from './util/Grid';
import {
    AlgorithmInfoMessage,
    AlgorithmStep,
    AlgorithmWorkerStepType,
    GridConstructorData, Heuristics, HeuristicsData,
    MessageType,
    WorkerGridTransferData
} from "./constants/types";
import GridNode, {GridCoordinates} from "./util/GridNode";

const ctx: Worker = self as any;


function processNeighbours(node: GridNode, neighbours: GridNode[], open: GridNode[], end: GridNode, grid: Grid) {

    neighbours.forEach(neighbour => {
        neighbour.setParameters(end, node);
        const existingNode = open.find(n => n.id === neighbour.id);
        if (existingNode && neighbour.g > existingNode.g) {
            sendAlgorithmInfoMessage(createInfoStep(
                neighbour.id,
                `This node was previously discovered and alternative path to it proves to be better`,
            ))
            return;
        } else if (existingNode) {
            sendAlgorithmInfoMessage(createInfoStep(
                neighbour.id,
                `This node was previously discovered and but better path was found`
            ))
            open.splice(open.indexOf(existingNode), 1);
        }
        sendAlgorithmInfoMessage(createInfoStep(
            neighbour.id,
            `Discovered a new node and sending it to open stack`,
            [neighbour.g, neighbour.h],
            node.id,
        ))
        grid.discover(neighbour);
        sendAlgorithmStep(createDiscoverStep(neighbour));
        open.push(neighbour);
    });
}

function markPath(endNode) {
    let backtrackNode = endNode;
    while (backtrackNode.parent != undefined) {
        sendAlgorithmStep(createMarkPathStep(backtrackNode));
        backtrackNode = backtrackNode.parent;
    }
    sendAlgorithmStep(createMarkPathStep(backtrackNode));
}

function sendAlgorithmStep(step: AlgorithmStep) {
    ctx.postMessage([MessageType.ALGORITHM_STEP, step]);
}

function sendAlgorithmInfoMessage(step: AlgorithmInfoMessage) {
    ctx.postMessage([MessageType.INFO_DATA, step]);
}

function createStartStep() {
    return {
        type: AlgorithmWorkerStepType.START
    }
}

function createInfoStep(tileId: string, info: string, ghValues?: [number, number], parent?: string): AlgorithmInfoMessage {
    return {
        type: AlgorithmWorkerStepType.INFO,
        info,
        ghValues,
        tileId,
        parent,
    }
}

function createMarkPathStep(node: GridNode): AlgorithmStep {
    return {
        type: AlgorithmWorkerStepType.MARK_PATH,
        location: node.toArray()
    }
}

function createEndStep(node: GridNode): AlgorithmStep {
    return {
        type: AlgorithmWorkerStepType.END,
        location: node.toArray()
    }
}

function createVisitStep(node: GridNode, neighbours: [number, number][]): AlgorithmStep {
    return {
        type: AlgorithmWorkerStepType.VISIT,
        neighbours,
        location: node.toArray()
    }
}

function createDiscoverStep(node: GridNode): AlgorithmStep {
    return {
        type: AlgorithmWorkerStepType.DISCOVER,
        location: node.toArray()
    }
}

function sortOpenNodes(open: GridNode[]) {
    open.sort((a, b) => {
        const costDiff = b.totalCost - a.totalCost;
        if (costDiff === 0) {
            return b.hCost - a.hCost;
        }
        return costDiff;
    });
}


function process(grid: Grid) {
    const startNode = grid.start;
    const endNode = grid.end;
    const open = [startNode];
    sendAlgorithmStep(createStartStep());
    while (open.length > 0) {
        const currentNode: GridNode | undefined = open.pop();
        if (!currentNode) return;

        grid.visit(currentNode);

        if (grid.isEndNode(currentNode)) {
            sendAlgorithmStep(createEndStep(currentNode));
            markPath(currentNode);
            return;
        }
        const neighbours: GridNode[] = grid.adjacentNodes(currentNode);
        sendAlgorithmStep(createVisitStep(currentNode, neighbours.map(n => n.toArray())));

        processNeighbours(currentNode, neighbours, open, endNode, grid);
        sortOpenNodes(open);
    }
}

function parseWorkerGridTransferData(gridData: WorkerGridTransferData): GridConstructorData {
    return {
        width: gridData.width,
        height: gridData.height,
        start: new GridCoordinates(gridData.start[0], gridData.start[1]),
        end: new GridCoordinates(gridData.end[0], gridData.end[1]),
        walls: gridData.walls.map(w => new GridCoordinates(w[0], w[1])),
        heuristics: gridData.heuristics,
    }
}


let grid: Grid;
onmessage = function (e) {
    switch (e.data[0]) {
        case MessageType.GRID_DATA: {
            const gridData = e.data[1];
            grid = new Grid(parseWorkerGridTransferData(gridData));
            setHeuristicsFunction(gridData.heuristics);
            process(grid);
            break;
        }
        case MessageType.SET_HEURISTICS: {
            const message = e.data[1];
            setHeuristicsFunction(message);
            break;
        }
    }
}
