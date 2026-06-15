import type { AreaOfInterest, DataKind, GeoItem, LayerKind, NavalBase, Port } from './types';

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
  const [ports, bases, areas] = await Promise.all([
    loadJson<Port[]>('/data/ports.json'),
    loadJson<NavalBase[]>('/data/naval_bases.json'),
    loadJson<AreaOfInterest[]>('/data/areas_of_interest.json'),
  ]);

  return [
    ...ports.map((data) => ({ kind: 'ports' as const, data })),
    ...bases.map((data) => ({ kind: 'naval_bases' as const, data })),
    ...areas.map((data) => ({ kind: 'areas_of_interest' as const, data })),
  ];
}

export const labels: Record<LayerKind, string> = {
  ports: 'Ports',
  naval_bases: 'Naval Bases',
  areas_of_interest: 'Areas of Interest',
  ocean_seas: 'Oceans & Seas',
};

export const colors: Record<LayerKind, string> = {
  ports: '#48d7ff',
  naval_bases: '#ff6b6b',
  areas_of_interest: '#b7ff5a',
  ocean_seas: '#4f8cff',
};
