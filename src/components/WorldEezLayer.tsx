import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Feature, GeoJsonObject, Geometry } from 'geojson';
import type { Layer } from 'leaflet';

type WorldEezProperties = {
  Country?: string;
  ISO_A3?: string;
};

const WORLD_EEZ_URL = `${import.meta.env.BASE_URL}data/world-eez.geojson`;
const worldEezLabelClass =
  'pointer-events-none !border-0 !bg-transparent !shadow-none !text-[10px] !font-semibold !tracking-[0.1em] !text-[rgba(255,224,130,0.72)] !uppercase before:!hidden [text-shadow:0_1px_3px_#1c1500,0_0_8px_#1c1500]';

export function WorldEezLayer({ visible, showLabels }: { visible: boolean; showLabels: boolean }) {
  const [data, setData] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    if (!visible || data) return;

    const controller = new AbortController();
    fetch(WORLD_EEZ_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`world-eez: ${response.status}`);
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
      key={`world-eez:${showLabels}`}
      data={data}
      interactive={false}
      onEachFeature={(feature: Feature<Geometry, WorldEezProperties>, layer: Layer) => {
        const country = feature.properties?.Country;
        if (!showLabels || !country) return;

        layer.bindTooltip(country, {
          permanent: true,
          direction: 'center',
          className: worldEezLabelClass,
          opacity: 1,
        });
      }}
      style={{
        color: '#f5d36b',
        fillColor: '#f5d36b',
        fillOpacity: 0.04,
        opacity: 0.7,
        weight: 1,
      }}
    />
  );
}
