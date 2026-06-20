import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { DataKind, GeoItem, LayerVisibility, OverlayKind, Point } from '../data/types';
import { boundsCorners, boundsFromPoints } from '../lib/bounds';
import { DevEditPointLayer } from './DevEditPointLayer';
import { EditorPanel } from './EditorPanel';
import { MapView } from './MapView';

export function DevMapEditor({
  items,
  selected,
  visible,
  overlayLabels,
  controls,
  onSelect,
  onRefresh,
}: {
  items: GeoItem[];
  selected: GeoItem | null;
  visible: LayerVisibility;
  overlayLabels: Record<OverlayKind, boolean>;
  controls: ReactNode;
  onSelect: (item: GeoItem | null) => void;
  onRefresh: () => void;
}) {
  const [drawKind, setDrawKind] = useState<DataKind | null>(null);
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const drawBounds = useMemo(() => boundsFromPoints(drawPoints), [drawPoints]);

  function closeEditor() {
    setDrawKind(null);
    setDrawPoints([]);
  }

  function selectMapItem(item: GeoItem) {
    if (drawKind !== null) return;
    onSelect(item);
  }

  return (
    <>
      <MapView
        items={items}
        selected={selected}
        showOceanSeas={visible.ocean_seas}
        showOceanSeasLabels={overlayLabels.ocean_seas}
        showWorldEez={visible.world_eez}
        showWorldEezLabels={overlayLabels.world_eez}
        onSelect={selectMapItem}
        onClearSelection={() => onSelect(null)}
        clearSelectionOnMapClick={drawKind === null}
        editing={drawKind !== null}
      >
        <DevEditPointLayer
          kind={drawKind}
          points={drawPoints}
          bounds={drawBounds}
          onChangePoints={setDrawPoints}
          onInsertPoint={(index, point) => setDrawPoints((points) => [...points.slice(0, index), point, ...points.slice(index)])}
        />
      </MapView>

      <div className="pointer-events-none absolute right-4 top-4 z-[1000] w-96 space-y-3">
        {controls}
        <div className="pointer-events-auto max-h-[calc(100vh-12rem)] overflow-auto">
          <EditorPanel
            selected={selected}
            bounds={drawBounds}
            points={drawPoints}
            pointsCount={drawPoints.length}
            onStartCreate={(kind) => { setDrawKind(kind); setDrawPoints([]); }}
            onStartEdit={(item) => {
              setDrawKind(item.kind);
              setDrawPoints(item.kind === 'areas_of_interest' ? item.data.bounds : boundsCorners(item.data.bounds));
            }}
            onClose={closeEditor}
            onClearPoints={() => setDrawPoints([])}
            onClearSelection={() => { onSelect(null); closeEditor(); }}
            onSaved={() => { onSelect(null); closeEditor(); onRefresh(); }}
          />
        </div>
      </div>
    </>
  );
}
