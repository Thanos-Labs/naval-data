import type { AreaOfInterest, DataKind, GeoItem, NavalBase, Port } from './types';

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
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

export const labels: Record<DataKind, string> = {
  ports: 'Ports',
  naval_bases: 'Naval Bases',
  areas_of_interest: 'Areas of Interest',
};

export const colors: Record<DataKind, string> = {
  ports: '#48d7ff',
  naval_bases: '#ff6b6b',
  areas_of_interest: '#b7ff5a',
};
