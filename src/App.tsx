import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { loadData } from './data/loaders';
import type { FacilityLayerKind, GeoItem, LayerVisibility, OverlayKind } from './data/types';
import { LayerControls } from './components/LayerControls';
import { MapView } from './components/MapView';

const DevMapEditor = import.meta.env.DEV
  ? lazy(() => import('./components/DevMapEditor').then((module) => ({ default: module.DevMapEditor })))
  : null;

const initialVisibility: LayerVisibility = {
  ports: true,
  naval_bases: true,
  shipyards: true,
  areas_of_interest: true,
  ocean_seas: false,
  world_eez: false,
};

const facilityLayerByType = {
  port: 'ports',
  naval_base: 'naval_bases',
  shipyard: 'shipyards',
} satisfies Record<string, FacilityLayerKind>;

const initialOverlayLabels: Record<OverlayKind, boolean> = {
  ocean_seas: false,
  world_eez: false,
};

export function App() {
  const [items, setItems] = useState<GeoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(initialVisibility);
  const [overlayLabels, setOverlayLabels] = useState(initialOverlayLabels);
  const [selected, setSelected] = useState<GeoItem | null>(null);

  async function refresh() {
    try {
      setError(null);
      setItems(await loadData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => item.kind === 'poi' ? visible[facilityLayerByType[item.data.type]] : visible[item.kind]),
    [items, visible],
  );
  const counts = useMemo(
    () => ({
      ports: items.filter((item) => item.kind === 'poi' && item.data.type === 'port').length,
      naval_bases: items.filter((item) => item.kind === 'poi' && item.data.type === 'naval_base').length,
      shipyards: items.filter((item) => item.kind === 'poi' && item.data.type === 'shipyard').length,
      areas_of_interest: items.filter((item) => item.kind === 'areas_of_interest').length,
    }),
    [items],
  );
  const controls = (
    <>
      {error && <div className="pointer-events-auto border border-destructive bg-card p-3 text-xs text-destructive">{error}</div>}
      <div className="pointer-events-auto">
        <LayerControls
          visible={visible}
          labelVisible={overlayLabels}
          counts={counts}
          onChange={setVisible}
          onLabelChange={setOverlayLabels}
        />
      </div>
    </>
  );

  return (
    <main className="relative h-full w-full bg-background text-foreground">
      {DevMapEditor ? (
        <Suspense fallback={null}>
          <DevMapEditor
            items={filtered}
            selected={selected}
            visible={visible}
            overlayLabels={overlayLabels}
            controls={controls}
            onSelect={setSelected}
            onRefresh={() => { void refresh(); }}
          />
        </Suspense>
      ) : (
        <>
          <MapView
            items={filtered}
            selected={selected}
            showOceanSeas={visible.ocean_seas}
            showOceanSeasLabels={overlayLabels.ocean_seas}
            showWorldEez={visible.world_eez}
            showWorldEezLabels={overlayLabels.world_eez}
            onSelect={setSelected}
            onClearSelection={() => setSelected(null)}
          />
          <div className="pointer-events-none absolute right-4 top-4 z-[1000] w-96 space-y-3">
            {controls}
          </div>
        </>
      )}
    </main>
  );
}
