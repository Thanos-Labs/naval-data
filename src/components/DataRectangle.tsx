import type { LeafletMouseEvent } from 'leaflet';
import { Polygon, Popup, Rectangle } from 'react-leaflet';
import { colors, labels } from '../data/loaders';
import type { Bounds, GeoItem, Point } from '../data/types';
import { leafletBounds, leafletPolygon } from '../lib/bounds';
import { Tag } from './ui';

function subtitle(item: GeoItem) {
  if (item.kind === 'poi') return `${item.data.country} · ${item.data.operator ?? item.data.type}`;
  return `${item.data.region} · ${item.data.type}`;
}

function notes(item: GeoItem) {
  return item.kind === 'aoi' ? item.data.notes : null;
}

function wiki(item: GeoItem) {
  return item.kind === 'aoi' ? item.data.wiki_url : null;
}

function itemLabel(item: GeoItem) {
  if (item.kind !== 'poi') return labels[item.kind];
  if (item.data.type === 'port') return labels.ports;
  if (item.data.type === 'shipyard') return labels.shipyards;
  return labels.naval_bases;
}

function itemColor(item: GeoItem) {
  if (item.kind !== 'poi') return colors[item.kind];
  if (item.data.type === 'port') return colors.ports;
  if (item.data.type === 'shipyard') return colors.shipyards;
  return colors.naval_bases;
}

function PopupContent({ item }: { item: GeoItem }) {
  return (
    <Popup>
      <div className="min-w-52 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Tag variant="accent">{itemLabel(item)}</Tag>
        </div>
        <div>
          <div className="font-medium text-foreground">{item.kind === 'poi' ? item.data.proper : item.data.name}</div>
          <div className="text-xs text-muted-foreground">{subtitle(item)}</div>
        </div>
        {notes(item) && <p className="text-xs text-muted-foreground">{notes(item)}</p>}
        {wiki(item) && (
          <a className="text-xs" href={wiki(item) ?? undefined} target="_blank" rel="noreferrer">
            Wikipedia
          </a>
        )}
      </div>
    </Popup>
  );
}

export function DataRectangle({
  item,
  bounds,
  selected,
  editing,
  onSelect,
}: {
  item: GeoItem;
  bounds: Bounds | Point[];
  selected: boolean;
  editing: boolean;
  onSelect: (item: GeoItem) => void;
}) {
  const color = itemColor(item);
  const pathOptions = { color, weight: selected ? 4 : 2, fillColor: color, fillOpacity: selected ? 0.28 : 0.16 };
  const eventHandlers = {
    click: (event: LeafletMouseEvent) => {
      event.originalEvent.stopPropagation();
      onSelect(item);
    },
  };

  if (Array.isArray(bounds)) {
    return (
      <Polygon positions={leafletPolygon(bounds)} pathOptions={pathOptions} eventHandlers={eventHandlers}>
        {!editing && <PopupContent item={item} />}
      </Polygon>
    );
  }

  return (
    <Rectangle bounds={leafletBounds(bounds)} pathOptions={pathOptions} eventHandlers={eventHandlers}>
      {!editing && <PopupContent item={item} />}
    </Rectangle>
  );
}
