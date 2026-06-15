import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Feature, GeoJsonObject, Geometry } from 'geojson';
import type { Layer } from 'leaflet';

type OceanSeaProperties = {
  NAME?: string;
};

const OCEANS_SEAS_URL = `${import.meta.env.BASE_URL}data/ocean-seas.geojson`;

export function OceanSeasLayer({ visible }: { visible: boolean }) {
  const [data, setData] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    if (!visible || data) return;

    const controller = new AbortController();
    fetch(OCEANS_SEAS_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`oceans-seas: ${response.status}`);
        return response.json() as Promise<GeoJsonObject>;
      })
      .then(setData)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error(error);
      });

    return () => controller.abort();
  }, [data, visible]);

  if (!visible || !data) return null;

  return (
    <GeoJSON
      key="ocean-seas"
      data={data}
      interactive={false}
      onEachFeature={(feature: Feature<Geometry, OceanSeaProperties>, layer: Layer) => {
        const name = feature.properties?.NAME;
        if (!name) return;

        layer.bindTooltip(name, {
          permanent: true,
          direction: 'center',
          className: 'ocean-sea-label',
          opacity: 1,
        });
      }}
      style={{
        color: '#4f8cff',
        fillColor: '#4f8cff',
        fillOpacity: 0.08,
        opacity: 0.55,
        weight: 1,
      }}
    />
  );
}
