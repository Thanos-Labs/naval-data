import type { LeafletMouseEvent } from 'leaflet';
import { CircleMarker, Polygon, Polyline, Rectangle, useMapEvents } from 'react-leaflet';
import type { Bounds, DataKind, Point } from '../data/types';
import { leafletBounds, leafletPolygon } from '../lib/bounds';

function segmentIndexes(kind: DataKind, points: Point[]) {
  const segments = points.slice(0, -1).map((_, index) => [index, index + 1] as const);
  if (kind === 'areas_of_interest' && points.length >= 3) segments.push([points.length - 1, 0]);
  return segments;
}

function EditPointEvents({
  movingIndex,
  onAddPoint,
  onMovePoint,
}: {
  movingIndex: number | null;
  onAddPoint: (point: Point) => void;
  onMovePoint: (index: number, point: Point) => void;
}) {
  useMapEvents({
    click(event) {
      const point = { lat: event.latlng.lat, lon: event.latlng.lng };
      if (movingIndex !== null) {
        onMovePoint(movingIndex, point);
        return;
      }
      onAddPoint(point);
    },
  });

  return null;
}

export function DevEditPointLayer({
  kind,
  points,
  bounds,
  movingIndex,
  onAddPoint,
  onInsertPoint,
  onRemovePoint,
  onBeginMovePoint,
  onMovePoint,
}: {
  kind: DataKind | null;
  points: Point[];
  bounds: Bounds | null;
  movingIndex: number | null;
  onAddPoint: (point: Point) => void;
  onInsertPoint: (index: number, point: Point) => void;
  onRemovePoint: (index: number) => void;
  onBeginMovePoint: (index: number) => void;
  onMovePoint: (index: number, point: Point) => void;
}) {
  if (!kind) return null;

  return (
    <>
      <EditPointEvents movingIndex={movingIndex} onAddPoint={onAddPoint} onMovePoint={onMovePoint} />
      {kind === 'areas_of_interest' && points.length >= 3 && (
        <Polygon
          positions={leafletPolygon(points)}
          pathOptions={{ color: '#ffffff', weight: 2, dashArray: '6 6', fillOpacity: 0.08, interactive: false }}
        />
      )}
      {kind !== 'areas_of_interest' && bounds && (
        <Rectangle
          bounds={leafletBounds(bounds)}
          pathOptions={{ color: '#ffffff', weight: 2, dashArray: '6 6', fillOpacity: 0.08, interactive: false }}
        />
      )}
      {segmentIndexes(kind, points).map(([from, to]) => (
        <Polyline
          key={`${from}:${to}`}
          positions={[[points[from].lat, points[from].lon], [points[to].lat, points[to].lon]]}
          pathOptions={{ color: '#69e7ff', opacity: 0, weight: 16 }}
          eventHandlers={{
            click: (event: LeafletMouseEvent) => {
              event.originalEvent.stopPropagation();
              onInsertPoint(from + 1, { lat: event.latlng.lat, lon: event.latlng.lng });
            },
          }}
        />
      ))}
      {points.map((point, index) => (
        <CircleMarker
          key={`${point.lat}:${point.lon}:${index}`}
          center={[point.lat, point.lon]}
          radius={8}
          bubblingMouseEvents={true}
          pathOptions={{
            color: movingIndex === index ? '#69e7ff' : '#ffffff',
            fillColor: movingIndex === index ? '#ffffff' : '#69e7ff',
            fillOpacity: 1,
            weight: 2,
          }}
          eventHandlers={{
            click: (event: LeafletMouseEvent) => {
              if (event.originalEvent.ctrlKey || event.originalEvent.altKey) {
                onBeginMovePoint(index);
                return;
              }
              onRemovePoint(index);
            },
          }}
        />
      ))}
    </>
  );
}
