import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { DataKind, GeoItem, LayerVisibility, OverlayKind, Point } from '../data/types';
import { boundsCorners, boundsFromPoints } from '../lib/bounds';
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
  const [movingIndex, setMovingIndex] = useState<number | null>(null);
  const drawBounds = useMemo(() => boundsFromPoints(drawPoints), [drawPoints]);

  function closeEditor() {
    setDrawKind(null);
    setDrawPoints([]);
    setMovingIndex(null);
  }

  return (
    <>
      <MapView
        items={items}
        selected={selected}
        drawKind={drawKind}
        showOceanSeas={visible.ocean_seas}
        showOceanSeasLabels={overlayLabels.ocean_seas}
        showWorldEez={visible.world_eez}
        showWorldEezLabels={overlayLabels.world_eez}
        drawPoints={drawPoints}
        drawBounds={drawBounds}
        movingIndex={movingIndex}
        onSelect={onSelect}
        onClearSelection={() => onSelect(null)}
        onAddPoint={(point) => setDrawPoints((points) => [...points, point])}
        onInsertPoint={(index, point) => setDrawPoints((points) => [...points.slice(0, index), point, ...points.slice(index)])}
        onRemovePoint={(index) => {
          setDrawPoints((points) => points.filter((_, i) => i !== index));
          setMovingIndex((current) => current === index ? null : current !== null && current > index ? current - 1 : current);
        }}
        onBeginMovePoint={setMovingIndex}
        onMovePoint={(index, point) => {
          setDrawPoints((points) => points.map((current, i) => i === index ? point : current));
          setMovingIndex(null);
        }}
      />

      <div className="pointer-events-none absolute right-4 top-4 z-[1000] w-96 space-y-3">
        {controls}
        <div className="pointer-events-auto max-h-[calc(100vh-12rem)] overflow-auto">
          <EditorPanel
            selected={selected}
            bounds={drawBounds}
            points={drawPoints}
            pointsCount={drawPoints.length}
            onStartCreate={(kind) => { setDrawKind(kind); setDrawPoints([]); setMovingIndex(null); }}
            onStartEdit={(item) => {
              setDrawKind(item.kind);
              setDrawPoints(item.kind === 'areas_of_interest' ? item.data.bounds : boundsCorners(item.data.bounds));
              setMovingIndex(null);
            }}
            onClose={closeEditor}
            onClearPoints={() => { setDrawPoints([]); setMovingIndex(null); }}
            onClearSelection={() => { onSelect(null); closeEditor(); }}
            onSaved={() => { onSelect(null); closeEditor(); onRefresh(); }}
          />
        </div>
      </div>
    </>
  );
}
