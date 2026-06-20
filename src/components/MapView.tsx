import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { GeoItem } from '../data/types';
import { boundsArea, pointsArea, shiftBounds, shiftPoints } from '../lib/bounds';
import { DataRectangle } from './DataRectangle';
import { OceanSeasLayer } from './OceanSeasLayer';
import { WorldEezLayer } from './WorldEezLayer';

function ClearSelectionEvents({
  enabled,
  onClearSelection,
}: {
  enabled: boolean;
  onClearSelection: () => void;
}) {
  useMapEvents({
    click() {
      if (!enabled) return;
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

export function MapView({
  items,
  selected,
  showOceanSeas,
  showOceanSeasLabels,
  showWorldEez,
  showWorldEezLabels,
  onSelect,
  onClearSelection,
  clearSelectionOnMapClick = true,
  editing = false,
  children,
}: {
  items: GeoItem[];
  selected: GeoItem | null;
  showOceanSeas: boolean;
  showOceanSeasLabels: boolean;
  showWorldEez: boolean;
  showWorldEezLabels: boolean;
  onSelect: (item: GeoItem) => void;
  onClearSelection: () => void;
  clearSelectionOnMapClick?: boolean;
  editing?: boolean;
  children?: ReactNode;
}) {
  const center: LatLngExpression = [20, 0];
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
      <OceanSeasLayer visible={showOceanSeas} showLabels={showOceanSeasLabels} />
      <WorldEezLayer visible={showWorldEez} showLabels={showWorldEezLabels} />
      {sortedItems.flatMap((item) => {
        const key = itemKey(item);
        return [-360, 0, 360].map((offset) => (
          <DataRectangle
            key={`${key}:${offset}`}
            item={item}
            bounds={item.kind === 'areas_of_interest' ? shiftPoints(item.data.bounds, offset) : shiftBounds(item.data.bounds, offset)}
            selected={selectedKey === key}
            editing={editing}
            onSelect={onSelect}
          />
        ));
      })}
      <ClearSelectionEvents enabled={clearSelectionOnMapClick} onClearSelection={onClearSelection} />
      {children}
    </MapContainer>
  );
}
