class Grid {
    constructor({width, height, start, end, walls}) {
        this.width = width;
        this.height = height;
        this.start = start;
        this.end = end;
        this.walls = walls;
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

}

export default Grid;
