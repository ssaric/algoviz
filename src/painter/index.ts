import type { ArrayLikeCoordinates } from "./GridNode";

export function debounce(func: any, wait: number, immediate?: false) {
  let timeout: number | null;
  return function () {
    // @ts-ignore
    const context: any = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    timeout !== null && clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
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

export function clamp(number: number, min: number, max: number): number {
  return Math.max(min, Math.min(number, max));
}
