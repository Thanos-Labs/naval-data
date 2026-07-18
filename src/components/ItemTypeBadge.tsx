import type { GeoItem } from '@/data/types';
import { colors } from '@/data/loaders';
import { Badge } from '@/components/ui/badge';

export function itemColor(item: GeoItem) {
  if (item.kind === 'aoi') return colors.aoi;
  if (item.data.type === 'port') return colors.ports;
  if (item.data.type === 'shipyard') return colors.shipyards;
  return colors.naval_bases;
}

export function itemName(item: GeoItem) {
  return item.kind === 'poi' ? item.data.proper : item.data.name;
}

export function ItemTypeBadge({ item }: { item: GeoItem }) {
  const color = itemColor(item);

  return (
    <Badge variant="outline" style={{ borderColor: color, color }}>
      {item.data.type.replaceAll('_', ' ')}
    </Badge>
  );
}
