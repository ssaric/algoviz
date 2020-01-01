export function getPositionFromDataset(element) {
    const cl = element.dataset.cellLocation.split('-');
    return [parseInt(cl[0], 10), parseInt(cl[1], 10)];
}

export function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};
