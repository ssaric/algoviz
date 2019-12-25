import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './legend.scss';

function LegendItem({
    onClick, icon, text, id, selected,
}) {
    const onClickCallback = useCallback(() => onClick(id), []);

    const legendItemClasses = cn('legend-item', { 'legend-item--selected': selected });

    return (
        <div className={legendItemClasses} onClick={onClickCallback}>
            <FontAwesomeIcon className="legend-item__icon" icon={icon} />
            <span className="legend-item__text">{text}</span>
        </div>
    );
}

LegendItem.propTypes = {
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    selected: PropTypes.bool,
};

LegendItem.defaultProps = {
    selected: false,
};

export default LegendItem;
