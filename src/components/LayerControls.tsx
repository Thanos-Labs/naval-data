import type { FacilityLayerKind, LayerVisibility, OverlayKind } from '../data/types';
import { colors, labels } from '../data/loaders';
import { ColorIndicator } from './ui/color-indicator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const dataOrder = ['ports', 'naval_bases', 'shipyards', 'aoi'] as const;
const overlayOrder: OverlayKind[] = ['ocean_seas', 'world_eez'];
type DataLayerKind = FacilityLayerKind | 'aoi';

export function LayerControls({
  visible,
  counts,
  labelVisible,
  onChange,
  onLabelChange,
}: {
  visible: LayerVisibility;
  labelVisible: Record<OverlayKind, boolean>;
  counts: Record<DataLayerKind, number>;
  onChange: (next: LayerVisibility) => void;
  onLabelChange: (next: Record<OverlayKind, boolean>) => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Layers</CardTitle>
      </CardHeader>
      <CardContent>
        <fieldset className="flex flex-col gap-1">
          <legend className="sr-only">Map layers</legend>
          {dataOrder.map((kind) => (
            <div key={kind} className="flex h-7 items-center gap-2">
              <Checkbox
                id={`layer-${kind}`}
                checked={visible[kind]}
                onCheckedChange={(checked) => onChange({ ...visible, [kind]: checked })}
              />
              <Label htmlFor={`layer-${kind}`}>
                <ColorIndicator color={colors[kind]} />{labels[kind]}
              </Label>
              <Badge variant="secondary" className="ml-auto">{counts[kind]}</Badge>
            </div>
          ))}
          {overlayOrder.map((kind) => (
            <div key={kind} className="flex h-7 items-center gap-2">
              <Checkbox
                id={`layer-${kind}`}
                checked={visible[kind]}
                onCheckedChange={(checked) => onChange({ ...visible, [kind]: checked })}
              />
              <Label htmlFor={`layer-${kind}`}>
                <ColorIndicator color={colors[kind]} />{labels[kind]}
              </Label>
              <div className={cn('ml-auto flex items-center gap-2', !visible[kind] && 'invisible')} aria-hidden={!visible[kind]}>
                <Checkbox
                  id={`labels-${kind}`}
                  checked={labelVisible[kind]}
                  disabled={!visible[kind]}
                  onCheckedChange={(checked) => onLabelChange({ ...labelVisible, [kind]: checked })}
                />
                <Label htmlFor={`labels-${kind}`}>Labels</Label>
              </div>
            </div>
          ))}
        </fieldset>
      </CardContent>
    </Card>
  );
}
