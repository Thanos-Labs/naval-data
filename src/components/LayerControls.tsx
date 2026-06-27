import type { FacilityLayerKind, LayerVisibility, OverlayKind } from '../data/types';
import { colors, labels } from '../data/loaders';
import { ColorIndicator, Panel } from './ui';

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
    <Panel title="Layers">
      <div className="space-y-2">
        {dataOrder.map((kind) => (
          <label key={kind} className="flex cursor-pointer items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={visible[kind]}
                onChange={(event) => onChange({ ...visible, [kind]: event.target.checked })}
                className="accent-cyan-300"
              />
              <ColorIndicator color={colors[kind]} label={labels[kind]} />
            </span>
            <span className="text-xs text-accent">{counts[kind]}</span>
          </label>
        ))}
        {overlayOrder.map((kind) => (
          <div key={kind} className="flex items-center justify-between gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={visible[kind]}
                onChange={(event) => onChange({ ...visible, [kind]: event.target.checked })}
                className="accent-cyan-300"
              />
              <ColorIndicator color={colors[kind]} label={labels[kind]} />
            </label>
            {visible[kind] && (
              <label className="flex cursor-pointer items-center gap-1.5 text-[10px] tracking-tui uppercase text-muted-foreground">
                <input
                  type="checkbox"
                  checked={labelVisible[kind]}
                  onChange={(event) => onLabelChange({ ...labelVisible, [kind]: event.target.checked })}
                  className="accent-cyan-300"
                />
                labels
              </label>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
