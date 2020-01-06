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

export default GridNode;
