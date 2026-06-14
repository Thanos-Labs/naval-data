import { CircleMarker, MapContainer, Polygon, Polyline, Rectangle, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet';
import { useMemo } from 'react';
import type { Bounds, GeoItem, Point } from '../data/types';
import { boundsArea, leafletBounds, leafletPolygon, pointsArea, shiftBounds, shiftPoints } from '../lib/bounds';
import { DataRectangle } from './DataRectangle';

function ClickCapture({
  enabled,
  movingIndex,
  onPoint,
  onMovePoint,
  onClearSelection,
}: {
  enabled: boolean;
  movingIndex: number | null;
  onPoint: (point: Point) => void;
  onMovePoint: (index: number, point: Point) => void;
  onClearSelection: () => void;
}) {
  useMapEvents({
    click(event) {
      if (enabled) {
        const point = { lat: event.latlng.lat, lon: event.latlng.lng };
        if (movingIndex !== null) {
          onMovePoint(movingIndex, point);
          return;
        }
        onPoint(point);
        return;
      }
      onClearSelection();
    },
  });
  return null;
}

function itemKey(item: GeoItem) {
  return `${item.kind}:${item.data._file ?? item.data.name}`;
}

function itemArea(item: GeoItem) {
  return item.kind === 'areas_of_interest' ? pointsArea(item.data.bounds) : boundsArea(item.data.bounds);
}

function segmentIndexes(kind: GeoItem['kind'] | null, points: Point[]) {
  const segments = points.slice(0, -1).map((_, index) => [index, index + 1] as const);
  if (kind === 'areas_of_interest' && points.length >= 3) segments.push([points.length - 1, 0]);
  return segments;
}

export function MapView({
  items,
  selected,
  drawKind,
  drawPoints,
  drawBounds,
  movingIndex,
  onSelect,
  onClearSelection,
  onAddPoint,
  onInsertPoint,
  onRemovePoint,
  onBeginMovePoint,
  onMovePoint,
}: {
  items: GeoItem[];
  selected: GeoItem | null;
  drawKind: GeoItem['kind'] | null;
  drawPoints: Point[];
  drawBounds: Bounds | null;
  movingIndex: number | null;
  onSelect: (item: GeoItem) => void;
  onClearSelection: () => void;
  onAddPoint: (point: Point) => void;
  onInsertPoint: (index: number, point: Point) => void;
  onRemovePoint: (index: number) => void;
  onBeginMovePoint: (index: number) => void;
  onMovePoint: (index: number, point: Point) => void;
}) {
  const center: LatLngExpression = [20, 0];
  const drawEnabled = drawKind !== null;
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => itemArea(b) - itemArea(a)),
    [items],
  );
  const selectedKey = selected ? itemKey(selected) : null;

  return (
    <MapContainer center={center} zoom={3} minZoom={2} maxZoom={18} zoomControl={false} className="z-0">
      <TileLayer
        attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, GIS User Community"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      {sortedItems.flatMap((item) => {
        const key = itemKey(item);
        return [-360, 0, 360].map((offset) => (
          <DataRectangle
            key={`${key}:${offset}`}
            item={item}
            bounds={item.kind === 'areas_of_interest' ? shiftPoints(item.data.bounds, offset) : shiftBounds(item.data.bounds, offset)}
            selected={selectedKey === key}
            editing={drawEnabled}
            onSelect={onSelect}
          />
        ));
      })}
      <ClickCapture
        enabled={drawEnabled}
        movingIndex={movingIndex}
        onPoint={onAddPoint}
        onMovePoint={onMovePoint}
        onClearSelection={onClearSelection}
      />
      {drawKind === 'areas_of_interest' && drawPoints.length >= 3 && (
        <Polygon
          positions={leafletPolygon(drawPoints)}
          pathOptions={{ color: '#ffffff', weight: 2, dashArray: '6 6', fillOpacity: 0.08, interactive: false }}
        />
      )}
      {drawKind !== 'areas_of_interest' && drawBounds && (
        <Rectangle
          bounds={leafletBounds(drawBounds)}
          pathOptions={{ color: '#ffffff', weight: 2, dashArray: '6 6', fillOpacity: 0.08, interactive: false }}
        />
      )}
      {drawEnabled && segmentIndexes(drawKind, drawPoints).map(([from, to]) => (
        <Polyline
          key={`${from}:${to}`}
          positions={[[drawPoints[from].lat, drawPoints[from].lon], [drawPoints[to].lat, drawPoints[to].lon]]}
          pathOptions={{ color: '#69e7ff', opacity: 0, weight: 16 }}
          eventHandlers={{
            click: (event: LeafletMouseEvent) => {
              event.originalEvent.stopPropagation();
              onInsertPoint(from + 1, { lat: event.latlng.lat, lon: event.latlng.lng });
            },
          }}
        />
      ))}
      {drawPoints.map((point, index) => (
        <CircleMarker
          key={`${point.lat}:${point.lon}:${index}`}
          center={[point.lat, point.lon]}
          radius={8}
          bubblingMouseEvents={false}
          pathOptions={{
            color: movingIndex === index ? '#69e7ff' : '#ffffff',
            fillColor: movingIndex === index ? '#ffffff' : '#69e7ff',
            fillOpacity: 1,
            weight: 2,
          }}
          eventHandlers={{
            click: (event: LeafletMouseEvent) => {
              if (event.originalEvent.ctrlKey) {
                onBeginMovePoint(index);
                return;
              }
              onRemovePoint(index);
            },
          }}
        />
      ))}
    </MapContainer>
  );
}
