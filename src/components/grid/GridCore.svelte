import React, { memo } from 'react';
import PropTypes from 'prop-types';
import GridRow from './grid-row';

/**
 * @return {null}
 */
function GridCore(props) {
    const {
        nrOfRows, numberOfCells, onCellClick,
    } = props;

    if (!numberOfCells) return null;

    const rows = [];
    for (let i = 0; i < nrOfRows; i++) {
        rows.push(
            <GridRow
                numberOfCells={numberOfCells}
                rowIndex={i}
                onCellClick={onCellClick}
                key={`row-${i}`}
            />
        );
    }

    return (
        <tbody>
            {rows}
        </tbody>
    );
}

GridCore.propTypes = {
    nrOfRows: PropTypes.number.isRequired,
    numberOfCells: PropTypes.number,
    onCellClick: PropTypes.func.isRequired,
};
GridCore.defaultProps = {
    numberOfCells: undefined,
};

export default memo(GridCore);
