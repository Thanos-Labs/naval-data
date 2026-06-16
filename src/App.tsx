import { useEffect, useMemo, useState } from 'react';
import { loadData } from './data/loaders';
import type { DataKind, GeoItem, LayerVisibility, OverlayKind, Point } from './data/types';
import { boundsCorners, boundsFromPoints } from './lib/bounds';
import { EditorPanel } from './components/EditorPanel';
import { LayerControls } from './components/LayerControls';
import { MapView } from './components/MapView';

const initialVisibility: LayerVisibility = {
  ports: true,
  naval_bases: true,
  areas_of_interest: true,
  ocean_seas: false,
  world_eez: false,
};

const initialOverlayLabels: Record<OverlayKind, boolean> = {
  ocean_seas: false,
  world_eez: false,
};

export function App() {
  const [items, setItems] = useState<GeoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(initialVisibility);
  const [overlayLabels, setOverlayLabels] = useState(initialOverlayLabels);
  const [drawKind, setDrawKind] = useState<DataKind | null>(null);
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [selected, setSelected] = useState<GeoItem | null>(null);

  async function refresh() {
    try {
      setError(null);
      setItems(await loadData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  }

  function closeEditor() {
    setDrawKind(null);
    setDrawPoints([]);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => items.filter((item) => visible[item.kind]), [items, visible]);
  const counts = useMemo(
    () => ({
      ports: items.filter((item) => item.kind === 'ports').length,
      naval_bases: items.filter((item) => item.kind === 'naval_bases').length,
      areas_of_interest: items.filter((item) => item.kind === 'areas_of_interest').length,
    }),
    [items],
  );
  const drawBounds = useMemo(() => boundsFromPoints(drawPoints), [drawPoints]);

  return (
    <main className="relative h-full w-full bg-background text-foreground">
      <MapView
        items={filtered}
        selected={selected}
        drawEnabled={drawKind !== null}
        showOceanSeas={visible.ocean_seas}
        showOceanSeasLabels={overlayLabels.ocean_seas}
        showWorldEez={visible.world_eez}
        showWorldEezLabels={overlayLabels.world_eez}
        drawPoints={drawPoints}
        drawBounds={drawBounds}
        onSelect={(item) => setSelected(item)}
        onClearSelection={() => setSelected(null)}
        onAddPoint={(point) => setDrawPoints((points) => [...points, point])}
        onRemovePoint={(index) => setDrawPoints((points) => points.filter((_, i) => i !== index))}
      />

      <div className="pointer-events-none absolute right-4 top-4 z-[1000] w-96 space-y-3">
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
        {import.meta.env.DEV && (
          <div className="pointer-events-auto max-h-[calc(100vh-12rem)] overflow-auto">
            <EditorPanel
              selected={selected}
              bounds={drawBounds}
              pointsCount={drawPoints.length}
              onStartCreate={(kind) => { setDrawKind(kind); setDrawPoints([]); }}
              onStartEdit={(item) => { setDrawKind(item.kind); setDrawPoints(boundsCorners(item.data.bounds)); }}
              onClose={closeEditor}
              onClearPoints={() => setDrawPoints([])}
              onClearSelection={() => { setSelected(null); closeEditor(); }}
              onSaved={() => { setSelected(null); closeEditor(); void refresh(); }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
