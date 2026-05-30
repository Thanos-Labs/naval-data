import { Popup, Rectangle } from 'react-leaflet';
import { colors, labels } from '../data/loaders';
import type { Bounds, GeoItem } from '../data/types';
import { leafletBounds } from '../lib/bounds';
import { Tag } from './ui';

function subtitle(item: GeoItem) {
  if (item.kind === 'ports') return `${item.data.country} · ${item.data.type}`;
  if (item.kind === 'naval_bases') return `${item.data.country} · ${item.data.operator}`;
  return `${item.data.region} · ${item.data.type}`;
}

function notes(item: GeoItem) {
  return item.data.notes;
}

function wiki(item: GeoItem) {
  return item.data.wikipedia_url;
}

export function DataRectangle({
  item,
  bounds,
  selected,
  editing,
  onSelect,
}: {
  item: GeoItem;
  bounds: Bounds;
  selected: boolean;
  editing: boolean;
  onSelect: (item: GeoItem) => void;
}) {
  const color = colors[item.kind];

  return (
    <Rectangle
      bounds={leafletBounds(bounds)}
      pathOptions={{ color, weight: selected ? 4 : 2, fillColor: color, fillOpacity: selected ? 0.28 : 0.16 }}
      eventHandlers={{
        click: (event) => {
          event.originalEvent.stopPropagation();
          onSelect(item);
        },
      }}
    >
      {!editing && (
        <Popup>
          <div className="min-w-52 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Tag variant="accent">{labels[item.kind]}</Tag>
            </div>
            <div>
              <div className="font-medium text-foreground">{item.data.name}</div>
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
      )}
    </Rectangle>
  );
}
