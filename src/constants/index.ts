import {icon} from '@fortawesome/fontawesome-svg-core';
import {
    faPlayCircle,
    faDotCircle,
    faSquareFull
} from '@fortawesome/free-solid-svg-icons';

export const elementsData = {
    walls: {
        text: 'walls',
        icon: icon(faSquareFull).html[0]
    },
    startPosition: {
        text: 'start position',
        icon: icon(faPlayCircle).html[0]
    },
    endPosition: {
        text: 'end position',
        icon: icon(faDotCircle).html[0]
    }
}
