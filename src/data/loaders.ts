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

type KeyedCollection<T> = Record<string, T>;

function collectionValues<T>(collection: KeyedCollection<T>) {
  return Object.values(collection);
}

export async function loadData(): Promise<GeoItem[]> {
  const [poi, areas] = await Promise.all([
    loadJson<KeyedCollection<PointOfInterest>>('/data/poi.json'),
    loadJson<KeyedCollection<AreaOfInterest>>('/data/aoi.json'),
  ]);

  return [
    ...collectionValues(poi).map((data) => ({ kind: 'poi' as const, data })),
    ...collectionValues(areas).map((data) => ({ kind: 'aoi' as const, data })),
  ];
}

export const labels: Record<LayerKind, string> = {
  ports: 'Ports',
  naval_bases: 'Naval Bases',
  shipyards: 'Shipyards',
  aoi: 'Areas of Interest',
  ocean_seas: 'Oceans & Seas',
  world_eez: 'World EEZs',
};

export const colors: Record<LayerKind, string> = {
  ports: '#48d7ff',
  naval_bases: '#ff6b6b',
  shipyards: '#ffb86b',
  aoi: '#b7ff5a',
  ocean_seas: '#4f8cff',
  world_eez: '#f5d36b',
};
