import type { Bounds, Point } from '../data/types';

export function boundsFromPoints(points: Point[]): Bounds | null {
  if (!points.length) return null;
  return {
    north: Math.max(...points.map((p) => p.lat)),
    south: Math.min(...points.map((p) => p.lat)),
    east: Math.max(...points.map((p) => p.lon)),
    west: Math.min(...points.map((p) => p.lon)),
  };
}

export function centerFromBounds(bounds: Bounds): Point {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lon: (bounds.east + bounds.west) / 2,
  };
}

export function centerFromPoints(points: Point[]): Point | null {
  const bounds = boundsFromPoints(points);
  return bounds ? centerFromBounds(bounds) : null;
}

export function leafletBounds(bounds: Bounds): [[number, number], [number, number]] {
  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
}

export function leafletPolygon(points: Point[]): [number, number][] {
  return points.map((point) => [point.lat, point.lon]);
}

export function boundsArea(bounds: Bounds) {
  return Math.abs((bounds.north - bounds.south) * (bounds.east - bounds.west));
}

export function pointsArea(points: Point[]) {
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

export function shiftPoints(points: Point[], offset: number): Point[] {
  return points.map((point) => ({ ...point, lon: point.lon + offset }));
}
