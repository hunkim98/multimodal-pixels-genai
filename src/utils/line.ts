import { Coord } from "./types";

/**
 * Check if the two lines overlap
 * @see {@link http://jsfiddle.net/justin_c_rounds/Gd2S2/}
 * @see {@link https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection}
 */
export function checkLineIntersection(
  point1Start: Coord,
  point1End: Coord,
  point2Start: Coord,
  point2End: Coord,
) {
  // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
  let a;
  let b;
  const result = {
    x: 0,
    y: 0,
    onLine1: false,
    onLine2: false,
  };

  const denominator =
    (point2End.y - point2Start.y) * (point1End.x - point1Start.x) -
    (point2End.x - point2Start.x) * (point1End.y - point1Start.y);
  if (denominator === 0) {
    return result;
  }
  a = point1Start.y - point2Start.y;
  b = point1Start.x - point2Start.x;
  const numerator1 =
    (point2End.x - point2Start.x) * a - (point2End.y - point2Start.y) * b;
  const numerator2 =
    (point1End.x - point1Start.x) * a - (point1End.y - point1Start.y) * b;
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  // if we cast these lines infinitely in both directions, they intersect here:
  result.x = point1Start.x + a * (point1End.x - point1Start.x);
  result.y = point1Start.y + a * (point1End.y - point1Start.y);
  /*
      // it is worth noting that this should be the same as:
      x = point2Start.x + (b * (point2End.x - point2Start.x));
      y = point2Start.x + (b * (point2End.y - point2Start.y));
      */
  // if line1 is a segment and line2 is infinite, they intersect if:
  if (a > 0 && a < 1) {
    result.onLine1 = true;
  }
  // if line2 is a segment and line1 is infinite, they intersect if:
  if (b > 0 && b < 1) {
    result.onLine2 = true;
  }
  // if line1 and line2 are segments, they intersect if both of the above are true
  return result;
}
