import type { DataKind, LayerVisibility } from '../data/types';
import { colors, labels } from '../data/loaders';
import { ColorIndicator, Panel } from './ui';

const order: DataKind[] = ['ports', 'naval_bases', 'areas_of_interest'];

export function LayerControls({
  visible,
  counts,
  onChange,
}: {
  visible: LayerVisibility;
  counts: Record<DataKind, number>;
  onChange: (next: LayerVisibility) => void;
}) {
  return (
    <Panel title="Layers">
      <div className="space-y-2">
        {order.map((kind) => (
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
      </div>
    </Panel>
  );
}
