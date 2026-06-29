import type { AreaBounds, Bounds, Point } from '../data/types';

export function hasPolygonRings(points: AreaBounds): points is Point[][] {
  return Array.isArray(points[0]);
}

function flattenAreaBounds(points: AreaBounds): Point[] {
  return hasPolygonRings(points) ? points.flat() : points;
}

export function boundsFromPoints(points: AreaBounds): Bounds | null {
  const flatPoints = flattenAreaBounds(points);
  if (!flatPoints.length) return null;
  return {
    north: Math.max(...flatPoints.map((p) => p.lat)),
    south: Math.min(...flatPoints.map((p) => p.lat)),
    east: Math.max(...flatPoints.map((p) => p.lon)),
    west: Math.min(...flatPoints.map((p) => p.lon)),
  };
}

export function centerFromBounds(bounds: Bounds): Point {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lon: (bounds.east + bounds.west) / 2,
  };
}

export function centerFromPoints(points: AreaBounds): Point | null {
  const bounds = boundsFromPoints(points);
  return bounds ? centerFromBounds(bounds) : null;
}

export function leafletBounds(bounds: Bounds): [[number, number], [number, number]] {
  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
}

export function leafletPolygon(points: AreaBounds): [number, number][] | [number, number][][] {
  if (hasPolygonRings(points)) {
    return points.map((polygon) => polygon.map((point) => [point.lat, point.lon] as [number, number]));
  }

  return points.map((point) => [point.lat, point.lon] as [number, number]);
}

export function boundsArea(bounds: Bounds) {
  return Math.abs((bounds.north - bounds.south) * (bounds.east - bounds.west));
}

export function pointsArea(points: AreaBounds) {
  const bounds = boundsFromPoints(points);
  return bounds ? boundsArea(bounds) : 0;
}

export function boundsCorners(bounds: Bounds): Point[] {
  return [
    { lat: bounds.north, lon: bounds.west },
    { lat: bounds.north, lon: bounds.east },
    { lat: bounds.south, lon: bounds.east },
    { lat: bounds.south, lon: bounds.west },
  ];
}

export function shiftBounds(bounds: Bounds, offset: number): Bounds {
  return {
    north: bounds.north,
    south: bounds.south,
    east: bounds.east + offset,
    west: bounds.west + offset,
  };
}

export function shiftPoints(points: AreaBounds, offset: number): AreaBounds {
  if (hasPolygonRings(points)) {
    return points.map((polygon) => polygon.map((point) => ({ ...point, lon: point.lon + offset })));
  }

  return points.map((point) => ({ ...point, lon: point.lon + offset }));
}
