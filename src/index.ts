import "./scss/index.scss";
import Grid from "./painter/Grid";
import { CELL_SIZE } from "./constants/types";
import Painter from "./painter/Painter";
import UI from "./painter/UI";

const root = document.getElementById("root") as HTMLDivElement;

const rootBbox = root.getBoundingClientRect();

const viewportWidth = rootBbox.width;
const viewportHeight = rootBbox.height;
const initialColumns = Math.floor(viewportWidth / CELL_SIZE);
const initialRows = Math.floor(viewportHeight / CELL_SIZE);

const grid = new Grid({
  columns: initialColumns,
  rows: initialRows,
});

const painter = new Painter(grid, root);
painter.renderGrid();

const ui = new UI(painter);
