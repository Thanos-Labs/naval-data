import type { ReactNode } from 'react';
import { PenLine, Trash2 } from 'lucide-react';
import type { Bounds, GeoItem } from '@/data/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ItemTypeBadge, itemName } from './ItemTypeBadge';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function BoundsDetails({ bounds }: { bounds: Bounds }) {
  return <>{bounds.north.toFixed(5)}, {bounds.south.toFixed(5)}, {bounds.east.toFixed(5)}, {bounds.west.toFixed(5)}</>;
}

export function SelectedItemPanel({
  item,
  error,
  deleting = false,
  onEdit,
  onDelete,
}: {
  item: GeoItem;
  error?: string | null;
  deleting?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{itemName(item)}</CardTitle>
        <CardDescription>{item.kind === 'poi' ? item.data.name : item.data.region}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ItemTypeBadge item={item} />
        <dl className="flex flex-col gap-2 text-sm">
          <Detail label="ID"><code>{item.data.id}</code></Detail>
          {item.kind === 'poi' ? (
            <>
              <Detail label="Country">{item.data.country}</Detail>
              <Detail label="Operator">{item.data.operator ?? 'Unknown'}</Detail>
              <Detail label="Center">{item.data.center.lat.toFixed(5)}, {item.data.center.lon.toFixed(5)}</Detail>
              <Detail label="Bounds"><BoundsDetails bounds={item.data.bounds} /></Detail>
              <Detail label="Carriers">{item.data.carriers.length ? item.data.carriers.join(', ') : 'None'}</Detail>
            </>
          ) : (
            <>
              <Detail label="Region">{item.data.region}</Detail>
              <Detail label="Strategic">{item.data.strategic_value}</Detail>
              <Detail label="Navigable">{item.data.carrier_navigable === null ? 'Unknown' : item.data.carrier_navigable ? 'Yes' : 'No'}</Detail>
              <Detail label="Vertices">{item.data.poly.length}</Detail>
              <Detail label="Bounds"><BoundsDetails bounds={item.data.bounds} /></Detail>
            </>
          )}
        </dl>
        {item.kind === 'aoi' && (item.data.notes || item.data.wiki_url) && <Separator />}
        {item.kind === 'aoi' && item.data.notes && <p className="text-sm text-muted-foreground">{item.data.notes}</p>}
        {item.kind === 'aoi' && item.data.wiki_url && (
          <a href={item.data.wiki_url} target="_blank" rel="noreferrer" className="text-sm">Wikipedia</a>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      {(onEdit || onDelete) && (
        <CardFooter className="gap-2">
          {onEdit && (
            <Button onClick={onEdit}>
              <PenLine data-icon="inline-start" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              <Trash2 data-icon="inline-start" />
              {deleting ? 'Deleting' : 'Delete'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
