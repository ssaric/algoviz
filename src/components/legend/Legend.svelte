import React from 'react';
import PropTypes from 'prop-types';

import './legend.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LegendItem from './legend-item';
import FieldType from '../../enums/field-type';

const Legend = ({ onItemClick, selectedFieldType, onStartClick }) => (
    <div className="legend">
        <div className="legend-wrapper">
            <LegendItem selected={selectedFieldType === FieldType.START} onClick={onItemClick} text="Start location" icon="play-circle" id={FieldType.START} />
            <LegendItem selected={selectedFieldType === FieldType.END} onClick={onItemClick} text="End location" icon="dot-circle" id={FieldType.END} />
            <LegendItem selected={selectedFieldType === FieldType.WALL} onClick={onItemClick} text="Wall" icon="square-full" id={FieldType.WALL} />
        </div>
        <div className="legend__start-button" onClick={onStartClick}>
            <FontAwesomeIcon className="legend-item__icon" icon="flag-checkered" />
            <span className="legend-item__text">Start</span>
        </div>
    </div>
);

Legend.propTypes = {
    onStartClick: PropTypes.func.isRequired,
    onItemClick: PropTypes.func.isRequired,
    selectedFieldType: PropTypes.oneOf([FieldType.START, FieldType.END, FieldType.WALL]).isRequired,
};
Legend.defaultProps = {};

export default Legend;
