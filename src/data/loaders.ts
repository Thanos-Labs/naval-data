import type { AreaOfInterest, GeoItem, LayerKind, PointOfInterest } from './types';

function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

async function loadJson<T>(path: string): Promise<T> {
  const url = assetPath(path);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function loadData(): Promise<GeoItem[]> {
  const [poi, areas] = await Promise.all([
    loadJson<PointOfInterest[]>('/data/poi.json'),
    loadJson<AreaOfInterest[]>('/data/areas_of_interest.json'),
  ]);

  return [
    ...poi.map((data) => ({ kind: 'poi' as const, data })),
    ...areas.map((data) => ({ kind: 'areas_of_interest' as const, data })),
  ];
}

export const labels: Record<LayerKind, string> = {
  ports: 'Ports',
  naval_bases: 'Naval Bases',
  shipyards: 'Shipyards',
  areas_of_interest: 'Areas of Interest',
  ocean_seas: 'Oceans & Seas',
  world_eez: 'World EEZs',
};

export const colors: Record<LayerKind, string> = {
  ports: '#48d7ff',
  naval_bases: '#ff6b6b',
  shipyards: '#ffb86b',
  areas_of_interest: '#b7ff5a',
  ocean_seas: '#4f8cff',
  world_eez: '#f5d36b',
};
