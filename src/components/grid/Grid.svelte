import GridCore from './grid-core';
import FieldType from '../../enums/field-type';

<script>
    import MouseClick from '../../enums/mouse-click';
    import FieldType from '../../enums/field-type';

    const sets = [];
    export let nrOfRows;
    export let gridRef;
    for (let i = 0; i < nrOfRows; i++) {
        sets.push([`${i}`, new Set()]);
    }

    const CELL_SIZE = 20;

    let selectedCells = new Map(sets);
    let dragSelect = false;
    let startNode = undefined;
    let endNode = undefined;
    let numberOfCells = 0;

    onMount = () => {
        numberOfCells = Math.floor(gridRef.offsetWidth / CELL_SIZE);
    }

    onDestroy = () => {
        document.removeEventListener('mouseout', this.onMouseOut);
    }

    function _setCellState(fieldType, node) {
        switch (fieldType) {
            case FieldType.WALL:
                node.classList.toggle('cell--wall');
                break;
            case FieldType.START:
                node.classList.add('cell--start');
                node.classList.remove('cell--wall');
                node.classList.remove('cell--end');
                this.setState(prevState => {
                    if (prevState.startNode) {
                        prevState.startNode.classList.remove('cell--start');
                    }
                    return {
                        startNode: node,
                    };
                });
                break;
            case FieldType.END:
                node.classList.add('cell--end');
                node.classList.remove('cell--wall');
                node.classList.remove('cell--start');
                if (endNode) {
                       endNode.classList.remove('cell--end');
                   }
                endNode =  node;
                break;
        }
    }

    function onMouseOut(e) {
        const from = e.relatedTarget;
        if (!from || from.nodeName === 'HTML') {
            dragSelect = false;
        }
    }


    function onCellClick(e) {
        if (!e.target.dataset.cellLocation) return;
        if (e.button !== MouseClick.LEFT) return;
        this._setCellState(this.props.selectedFieldType, e.target);
    }

</script>


onCellClick = e => {
if (!e.target.dataset.cellLocation) return;
if (e.button !== MouseClick.LEFT) return;
this._setCellState(this.props.selectedFieldType, e.target);
}




onMouseDown = e => {
if (e.button !== MouseClick.LEFT) return;
if (this.props.selectedFieldType !== FieldType.WALL) return;
document.addEventListener('mouseout', this.onMouseOut);
this.setState({
dragSelect: true,
});
}

onMouseMove = e => {
if (!this.state.dragSelect) return;
if (this.props.selectedFieldType !== FieldType.WALL) return;
if (!e.target.dataset.cellLocation) return;
e.target.classList.add('cell--wall');
}


onMouseUp = () => {
if (this.props.selectedFieldType !== FieldType.WALL) return;
document.removeEventListener('mouseout', this.onMouseOut);
this.setState({
dragSelect: false,
});
}



render() {
const tableClasses = cn('table', {
'table--wall-overlay': this.props.selectedFieldType === FieldType.WALL,
'table--start-overlay': this.props.selectedFieldType === FieldType.START,
'table--end-overlay': this.props.selectedFieldType === FieldType.END,
});

return (

);
}
}


<table class="table" class:table--wall-overlay={selectedFieldType === FieldType.WALL} onMouseUp={this.onMouseUp}
       onMouseDown={this.onMouseDown} onMouseMove={this.onMouseMove}>
    <GridCore nrOfRows={this.props.nrOfRows} numberOfCells={this.state.numberOfCells}
              selectedCells={this.state.selectedCells} onCellClick={this.onCellClick}/>
</table>

export default Grid;
