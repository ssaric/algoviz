import React from 'react';
import PropTypes from 'prop-types';


function GridRow(props) {
    const {
        numberOfCells, onCellClick,
    } = props;

    const cells = [];

    for (let j = 0; j < numberOfCells; j++) {
        cells.push(<td
            className="cell"
            onClick={onCellClick}
            data-cell-location={`${props.rowIndex}-${j}`}
            id={`${props.rowIndex}-${j}`}
            key={`${j}`}
        />);
    }

    return (
        <tr className="row">
            {cells}
        </tr>
    );
}

GridRow.propTypes = {
    rowIndex: PropTypes.number.isRequired,
    numberOfCells: PropTypes.number.isRequired,
    onCellClick: PropTypes.func.isRequired,
};
GridRow.defaultProps = {
};


export default GridRow;
