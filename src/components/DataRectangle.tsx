import type { LeafletMouseEvent } from 'leaflet';
import { Polygon, Popup, Rectangle } from 'react-leaflet';
import type { Bounds, GeoItem, Point } from '../data/types';
import { leafletBounds, leafletPolygon } from '../lib/bounds';
import { ItemTypeBadge, itemColor, itemName } from './ItemTypeBadge';

function PopupContent({ item }: { item: GeoItem }) {
  return (
    <Popup closeButton={false}>
      <div className="flex min-w-48 flex-col gap-2 text-sm">
        <div className="font-medium text-foreground">{itemName(item)}</div>
        <div className="flex items-center gap-2">
          <ItemTypeBadge item={item} />
          <code className="text-xs text-muted-foreground">{item.data.id}</code>
        </div>
      </div>
    </Popup>
  );
}

export function DataRectangle({
  item,
  bounds,
  selected,
  interactive,
  onSelect,
}: {
  item: GeoItem;
  bounds: Bounds | Point[];
  selected: boolean;
  interactive: boolean;
  onSelect: (item: GeoItem) => void;
}) {
  const color = itemColor(item);
  const pathOptions = { color, weight: selected ? 4 : 2, fillColor: color, fillOpacity: selected ? 0.28 : 0.16 };
  const eventHandlers = interactive ? {
    click: (event: LeafletMouseEvent) => {
      event.originalEvent.stopPropagation();
      onSelect(item);
    },
  } : undefined;

  if (Array.isArray(bounds)) {
    return (
      <Polygon positions={leafletPolygon(bounds)} pathOptions={{ ...pathOptions, interactive }} eventHandlers={eventHandlers}>
        {interactive && <PopupContent item={item} />}
      </Polygon>
    );
  }

  return (
    <Rectangle bounds={leafletBounds(bounds)} pathOptions={{ ...pathOptions, interactive }} eventHandlers={eventHandlers}>
      {interactive && <PopupContent item={item} />}
    </Rectangle>
  );
}
