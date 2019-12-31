export function getPositionFromDataset(element) {
    const cl = element.dataset.cellLocation.split('-');
    return [parseInt(cl[0], 10), parseInt(cl[1], 10)];
}
