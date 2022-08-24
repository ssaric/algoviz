import GridNode, {GridCoordinates} from "./GridNode";
import {GridConstructorData, Heuristics, HeuristicsData,} from "../constants/types";
import {evaluate} from "mathjs";
import MouseHandlers from "./MouseHandlers";

export interface HeuristicsFunction {
  (nodeA: GridCoordinates, nodeB: GridCoordinates): number;
}

function manhattanHeuristics(nodeA: GridCoordinates, nodeB: GridCoordinates) {
  return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
}
function euclideanHeuristics(nodeA: GridCoordinates, nodeB: GridCoordinates) {
  return (nodeA.x - nodeB.x) ** 2 + (nodeA.y - nodeB.y) ** 2;
}


const customHeuristics =
  (formula: string) => (nodeA: GridCoordinates, nodeB: GridCoordinates) => {
    const scope = {
      x: nodeA.x - nodeB.x,
      y: nodeA.y - nodeB.y,
    };
    return evaluate(formula, scope);
  };

export function setHeuristicsFunction(heuristicsData: HeuristicsData) {
  switch (heuristicsData.type) {
    case Heuristics.MANHATTAN:
      Grid.heuristicsFunction = manhattanHeuristics;
      break;
    case Heuristics.CUSTOM:
      Grid.heuristicsFunction = customHeuristics(heuristicsData.formula);
      break;
    default:
    case Heuristics.EUCLIDEAN:
      Grid.heuristicsFunction = euclideanHeuristics;
      break;
  }
}

class Grid {
  public columns: number;
  public rows: number;
  public start: GridNode | null = null;
  public end: GridNode | null = null;
  private walls: Map<string, GridNode>;
  private visited: Map<string, GridNode>;
  private discovered: Map<string, GridNode>;
  public static heuristicsFunction: HeuristicsFunction = euclideanHeuristics;

  constructor({ columns, rows, start, end, walls }: GridConstructorData) {
    this.columns = columns;
    this.rows = rows;
    this.walls = new Map();
    this.visited = new Map();
    this.discovered = new Map();
    walls?.forEach((w: GridCoordinates) =>
      this.walls.set(w.id, new GridNode(w))
    );
    if (start) {
      this.start = new GridNode(start);
    } else {
      this.createStartNode();
    }

    if (end) {
      this.end = new GridNode(end);
    } else {
      this.createEndNode();
    }
  }

  public get wallsAsArray(): Array<[number,number]> {
    return [...this.walls.values()].map(w => w.toArray());
  }

  public get startAsArray(): [number,number] | undefined{
    return this.start?.toArray();
  }

  public get endAsArray(): [number,number] | undefined {
    return this.end?.toArray();
  }

  public isGridValid(): boolean {
    return this.walls?.size !== 0 && this.start !== null && this.end !== null
  }

  public nearestFreeCell(
    columnIndex: number,
    rowIndex: number
  ): [number, number] | null {
    const visited = new Set<string>();
    const startNode = new GridNode(new GridCoordinates(columnIndex, rowIndex));
    visited.add(startNode.id);
    const neighbourMap = this.getCellNeighbours(startNode);
    let nodes = [...neighbourMap.values()];
    while (nodes.length > 0) {
      const neighbour = nodes.shift();
      if (!neighbour) continue;
      if (this.isCellFree(neighbour)) return neighbour.toArray();
      visited.add(neighbour.id);
      const validNeighbours = this.getCellNeighbours(neighbour);
      validNeighbours.delete(neighbour.id);
      nodes = [...nodes, ...validNeighbours.values()];
    }
    return null;
  }

  public addWall(columnIndex: number, rowIndex: number) {
    this.walls.set(
      [columnIndex, rowIndex].toString(),
      new GridNode(new GridCoordinates(columnIndex, rowIndex))
    );
  }

  public removeWall(columnIndex: number, rowIndex: number) {
    this.walls.delete(
      [columnIndex, rowIndex].toString()
    );
  }

  public setStart(columnIndex: number, rowIndex: number) {
    this.start = new GridNode(new GridCoordinates(columnIndex, rowIndex));
  }

  public setEnd(columnIndex: number, rowIndex: number) {
    this.end = new GridNode(new GridCoordinates(columnIndex, rowIndex));
  }


  public updateColumns(newColumns: number) {
    this.columns = newColumns;
    if (this.start && this.start.coordinates.x + 1 > this.columns) {
      this.start.coordinates.x = this.columns - 1;
    }
    if (this.end && this.end.coordinates.x + 1 > this.columns) {
      this.end.coordinates.x = this.columns - 1;
    }
  }

  public updateRows(newRows: number) {
    this.rows = newRows;
    if (this.start && this.start.coordinates.y + 1 > this.rows) {
      this.start.coordinates.y = this.rows;
    }
    if (this.end && this.end.coordinates.y + 1 > this.rows) {
      this.end.coordinates.y = this.rows;
    }
  }

  public createStartNode() {
    const startNodeRow = Math.floor(this.rows / 2);
    const startNodeColumn = Math.floor(this.columns / 8);
    this.setStart(startNodeColumn, startNodeRow);
  }

  public createEndNode() {
    const endNodeRow = Math.floor(this.rows / 2);
    const endNodeColumn = Math.floor(this.columns * (7 / 8));
    this.setEnd(endNodeColumn, endNodeRow);
  }

  visit(node: GridNode) {
    this.visited.set(node.id, node);
  }

  discover(node: GridNode) {
    this.discovered.set(node.id, node);
  }

  isEnd(node: GridNode  | GridCoordinates): boolean {
    return !!this.end && node.equals(this.end);
  }

  isStart(node: GridNode  | GridCoordinates): boolean {
    return !!this.start && node.equals(this.start);
  }

  isVisited(gridLocation: GridCoordinates): boolean {
    return this.visited.has(gridLocation.id);
  }

  isWall(gridNode: GridNode  | GridCoordinates): boolean {
    return this.walls.has(gridNode.id);
  }

  /** Can algorithm consider this cell for next step **/
  public isCellWalkable(location: GridNode | GridCoordinates): boolean {
    return this.isCellFree(location) && !this.isVisited(location);
  }

  /** Can you put a wall, start or end node in this cell **/
  public isCellFree(location: GridNode  | GridCoordinates): boolean {
    return (
      this.isWithinGridBounds(location) &&
      !this.isWall(location) &&
      !this.isStart(location) &&
      !this.isEnd(location)
    );
  }

  isWithinGridBounds(location: GridNode  | GridCoordinates) {
    return !(
      location.x < 0 ||
      location.x > this.columns - 1 ||
      location.y < 0 ||
      location.y > this.rows - 1
    );
  }

  getNeighboursTemplate(
    gridNode: GridNode,
    testFunction: (location: GridCoordinates | GridNode) => boolean
  ): Map<string, GridNode> {
    const up = new GridCoordinates(gridNode.x, gridNode.y - 1);
    const bottom = new GridCoordinates(
      gridNode.x,
      gridNode.y + 1
    );
    const right = new GridCoordinates(gridNode.x + 1, gridNode.y);
    const left = new GridCoordinates(gridNode.x - 1, gridNode.y);
    const nodes = new Map<string, GridNode>();

    if (testFunction(up)) nodes.set(up.id, new GridNode(up));
    if (testFunction(bottom)) nodes.set(bottom.id, new GridNode(bottom));
    if (testFunction(right)) nodes.set(right.id, new GridNode(right));
    if (testFunction(left)) nodes.set(left.id, new GridNode(left));
    return nodes;
  }

  getCellNeighbours(gridNode: GridNode): Map<string, GridNode> {
    return this.getNeighboursTemplate(
      gridNode,
      this.isWithinGridBounds.bind(this)
    );
  }

  getCellFreeNeighbours(
    gridNode: GridNode
  ): Map<string, GridNode> {
    return this.getNeighboursTemplate(
      gridNode,
      this.isCellFree.bind(this)
    );
  }

  public reset(): void {
    this.walls = new Map();
  }

  public getWalkableNeighbours(gridNode: GridNode) {
    return this.getNeighboursTemplate(
      gridNode,
      this.isCellWalkable.bind(this)
    );
  }
}

export default Grid;
