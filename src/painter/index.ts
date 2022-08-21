import type { ArrayLikeCoordinates } from "./GridNode";

export function getPositionFromDataset(element: HTMLElement) {
  const cl = element.dataset.cellLocation.split(",");
  return [parseInt(cl[0], 10), parseInt(cl[1], 10)];
}

export function debounce(func: any, wait: number, immediate?: false) {
  let timeout;
  return function () {
    // @ts-ignore
    const context: any = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

export function isLocationValid(
  location: ArrayLikeCoordinates,
  width: number,
  height: number
) {
  return !(
    location[0] < 0 ||
    location[0] > height - 1 ||
    location[1] < 0 ||
    location[1] > width - 1
  );
}

export function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}
