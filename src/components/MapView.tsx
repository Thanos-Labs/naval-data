import { CircleMarker, MapContainer, Rectangle, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { useMemo } from 'react';
import type { Bounds, GeoItem, Point } from '../data/types';
import { boundsArea, leafletBounds } from '../lib/bounds';
import { DataRectangle } from './DataRectangle';

function ClickCapture({
  enabled,
  onPoint,
  onClearSelection,
}: {
  enabled: boolean;
  onPoint: (point: Point) => void;
  onClearSelection: () => void;
}) {
  useMapEvents({
    click(event) {
      if (enabled) {
        onPoint({ lat: event.latlng.lat, lon: event.latlng.lng });
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

function shiftBounds(bounds: Bounds, offset: number): Bounds {
  return {
    north: bounds.north,
    south: bounds.south,
    east: bounds.east + offset,
    west: bounds.west + offset,
  };
}

export function MapView({
  items,
  selected,
  drawEnabled,
  drawPoints,
  drawBounds,
  onSelect,
  onClearSelection,
  onAddPoint,
  onRemovePoint,
}: {
  items: GeoItem[];
  selected: GeoItem | null;
  drawEnabled: boolean;
  drawPoints: Point[];
  drawBounds: Bounds | null;
  onSelect: (item: GeoItem) => void;
  onClearSelection: () => void;
  onAddPoint: (point: Point) => void;
  onRemovePoint: (index: number) => void;
}) {
  const center: LatLngExpression = [20, 0];
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => boundsArea(b.data.bounds) - boundsArea(a.data.bounds)),
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
            bounds={shiftBounds(item.data.bounds, offset)}
            selected={selectedKey === key}
            editing={drawEnabled}
            onSelect={onSelect}
          />
        ));
      })}
      <ClickCapture enabled={drawEnabled} onPoint={onAddPoint} onClearSelection={onClearSelection} />
      {drawBounds && (
        <Rectangle
          bounds={leafletBounds(drawBounds)}
          pathOptions={{ color: '#ffffff', weight: 2, dashArray: '6 6', fillOpacity: 0.08, interactive: false }}
        />
      )}
      {drawPoints.map((point, index) => (
        <CircleMarker
          key={`${point.lat}:${point.lon}:${index}`}
          center={[point.lat, point.lon]}
          radius={8}
          bubblingMouseEvents={false}
          pathOptions={{ color: '#ffffff', fillColor: '#69e7ff', fillOpacity: 1, weight: 2 }}
          eventHandlers={{ click: () => onRemovePoint(index) }}
        />
      ))}
    </MapContainer>
  );
}
