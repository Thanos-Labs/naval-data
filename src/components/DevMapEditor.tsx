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
  onSelect,
  onRefresh,
}: {
  items: GeoItem[];
  selected: GeoItem | null;
  visible: LayerVisibility;
  overlayLabels: Record<OverlayKind, boolean>;
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

  return (
    <>
      <MapView
        items={items}
        selected={selected}
        showOceanSeas={visible.ocean_seas}
        showOceanSeasLabels={overlayLabels.ocean_seas}
        showWorldEez={visible.world_eez}
        showWorldEezLabels={overlayLabels.world_eez}
        onSelect={onSelect}
        onClearSelection={() => onSelect(null)}
        clearSelectionOnMapClick={drawKind === null}
        itemsInteractive={drawKind === null}
      >
        <DevEditPointLayer
          kind={drawKind}
          points={drawPoints}
          bounds={drawBounds}
          onChangePoints={setDrawPoints}
          onInsertPoint={(index, point) => setDrawPoints((points) => [...points.slice(0, index), point, ...points.slice(index)])}
        />
      </MapView>

      <div className="pointer-events-none absolute right-3 top-[17rem] z-10 flex max-h-[calc(100vh-18rem)] w-96 max-w-[calc(100vw-1.5rem)] flex-col sm:right-4 sm:top-4 sm:max-h-[calc(100vh-2rem)]">
        <div className="pointer-events-auto min-h-0 flex-1">
          <EditorPanel
            selected={selected}
            bounds={drawBounds}
            points={drawPoints}
            pointsCount={drawPoints.length}
            onStartCreate={(kind) => { setDrawKind(kind); setDrawPoints([]); }}
            onStartEdit={(item) => {
              setDrawKind(item.kind);
              setDrawPoints(item.kind === 'aoi' ? item.data.poly : boundsCorners(item.data.bounds));
            }}
            onClose={closeEditor}
            onClearPoints={() => setDrawPoints([])}
            onMutated={() => { onSelect(null); closeEditor(); onRefresh(); }}
          />
        </div>
      </div>
    </>
  );
}
