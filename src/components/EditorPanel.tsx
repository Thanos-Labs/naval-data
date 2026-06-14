import type * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Bounds, DataKind, GeoItem } from '../data/types';
import { centerFromBounds, centerFromPoints } from '../lib/bounds';
import { Panel, SectionHeader, Button } from './ui';

const kindLabels: Record<DataKind, string> = {
  ports: 'Port',
  naval_bases: 'Naval Base',
  areas_of_interest: 'Area of Interest',
};

const portTypes = ['commercial', 'military', 'dual_use', 'shipyard', 'terminal'];
const areaTypes = ['strait', 'canal', 'chokepoint', 'sea_lane', 'sea', 'gulf', 'bay', 'operating_area'];
const carrier = ['yes', 'no', 'limited', 'unknown'];
const strategic = ['low', 'medium', 'high', 'critical'];

type Mode = 'create' | 'edit';

function num(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text === '' ? null : Number(text);
}

function text(value: FormDataEntryValue | null, required = false) {
  const out = String(value ?? '').trim();
  return out || (required ? '' : null);
}

function bool(value: FormDataEntryValue | null) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function boolValue(value: boolean | null | undefined) {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return 'null';
}

function getValue(item: GeoItem['data'] | undefined, key: string) {
  if (!item || !(key in item)) return undefined;
  return (item as Record<string, unknown>)[key] as string | number | boolean | null | undefined;
}

function getText(item: GeoItem['data'] | undefined, key: string) {
  const value = getValue(item, key);
  return typeof value === 'string' || typeof value === 'number' ? value : '';
}

function getBool(item: GeoItem['data'] | undefined, key: string) {
  const value = getValue(item, key);
  return typeof value === 'boolean' ? value : null;
}

function Field({ name, label, type = 'text', required = false, value }: { name: string; label: string; type?: string; required?: boolean; value?: string | number | null }) {
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span className="tracking-tui uppercase">{label}</span>
      <input name={name} type={type} required={required} defaultValue={value ?? ''} className="w-full border border-border bg-background px-2 py-1 text-foreground" />
    </label>
  );
}

function Select({ name, label, values, value }: { name: string; label: string; values: string[]; value?: string }) {
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span className="tracking-tui uppercase">{label}</span>
      <select name={name} defaultValue={value ?? values[0]} className="w-full border border-border bg-background px-2 py-1 text-foreground">
        {values.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TriBool({ name, label, value }: { name: string; label: string; value?: boolean | null }) {
  return <Select name={name} label={label} values={['null', 'true', 'false']} value={boolValue(value)} />;
}

function BoundsReadout({ bounds }: { bounds: Bounds }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
      <div>N {bounds.north.toFixed(5)}</div>
      <div>S {bounds.south.toFixed(5)}</div>
      <div>E {bounds.east.toFixed(5)}</div>
      <div>W {bounds.west.toFixed(5)}</div>
    </div>
  );
}

export function EditorPanel({
  selected,
  bounds,
  points,
  pointsCount,
  onStartCreate,
  onStartEdit,
  onClose,
  onClearPoints,
  onClearSelection,
  onSaved,
}: {
  selected: GeoItem | null;
  bounds: Bounds | null;
  points: { lat: number; lon: number }[];
  pointsCount: number;
  onStartCreate: (kind: DataKind) => void;
  onStartEdit: (item: GeoItem) => void;
  onClose: () => void;
  onClearPoints: () => void;
  onClearSelection: () => void;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [kind, setKind] = useState<DataKind>('ports');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const center = useMemo(() => (kind === 'areas_of_interest' ? centerFromPoints(points) : bounds ? centerFromBounds(bounds) : null), [bounds, kind, points]);
  const editing = mode === 'edit' ? selected : null;
  const data = editing?.data;

  useEffect(() => {
    if (!selected && mode === 'edit') {
      setOpen(false);
      setMode('create');
    }
  }, [selected, mode]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function openCreate() {
    setMode('create');
    setOpen(true);
    setMessage(null);
    onStartCreate(kind);
  }

  function openEdit() {
    if (!selected) return;
    setMode('edit');
    setKind(selected.kind);
    setOpen(true);
    setMessage(null);
    onStartEdit(selected);
  }

  function close() {
    setOpen(false);
    setMessage(null);
    onClose();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bounds || !center) return;
    if (kind === 'areas_of_interest' && points.length < 3) return;

    const form = new FormData(event.currentTarget);
    const common = {
      name: text(form.get('name'), true),
      bounds,
      notes: text(form.get('notes')),
      wikipedia_url: text(form.get('wikipedia_url')),
    };

    const payload = kind === 'ports'
      ? {
          ...common,
          country: text(form.get('country'), true),
          type: String(form.get('type')),
          location: center,
          nearest_city: text(form.get('nearest_city')),
          operator: text(form.get('operator')),
          max_ship_length_m: num(form.get('max_ship_length_m')),
          max_ship_beam_m: num(form.get('max_ship_beam_m')),
          max_draught_m: num(form.get('max_draught_m')),
          berth_depth_m: num(form.get('berth_depth_m')),
          channel_depth_m: num(form.get('channel_depth_m')),
          carrier_capable: String(form.get('carrier_capable')),
        }
      : kind === 'naval_bases'
        ? {
            ...common,
            country: text(form.get('country'), true),
            operator: text(form.get('operator'), true),
            location: center,
            nearest_city: text(form.get('nearest_city')),
            max_ship_length_m: num(form.get('max_ship_length_m')),
            max_ship_beam_m: num(form.get('max_ship_beam_m')),
            max_draught_m: num(form.get('max_draught_m')),
            pier_depth_m: num(form.get('pier_depth_m')),
            dry_dock_length_m: num(form.get('dry_dock_length_m')),
            carrier_capable: String(form.get('carrier_capable')),
            homeport_for_carriers: bool(form.get('homeport_for_carriers')),
          }
        : {
            ...common,
            bounds: points,
            type: String(form.get('type')),
            region: text(form.get('region'), true),
            center,
            min_depth_m: num(form.get('min_depth_m')),
            min_width_km: num(form.get('min_width_km')),
            strategic_value: String(form.get('strategic_value')),
            carrier_navigable: bool(form.get('carrier_navigable')),
          };

    const file = mode === 'edit' && data?._file ? `?file=${encodeURIComponent(data._file)}` : '';
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/data/${kind}${file}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!response.ok) {
      setMessage(await response.text());
      return;
    }

    setMessage('saved');
    onSaved();
    setOpen(false);
  }

  if (!open) {
    return (
      <Panel
        title="Dev Tools"
        action={selected && (
          <Button variant="ghost" onClick={onClearSelection} aria-label="Clear selection" className="h-5 w-5 justify-center p-0">
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        )}
      >
        <Button variant="accent" onClick={selected ? openEdit : openCreate}>{selected ? 'Edit' : 'Create'}</Button>
        {selected && <div className="mt-2 text-xs text-muted-foreground">Selected: <span className="text-foreground">{selected.data.name}</span></div>}
      </Panel>
    );
  }

  return (
    <Panel
      title={mode === 'edit' ? 'Edit Area' : 'Create Area'}
      action={
        <Button variant="ghost" onClick={close} aria-label="Close" className="h-5 w-5 justify-center p-0">
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      }
    >
      <div className="space-y-3">
        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="tracking-tui uppercase">Kind</span>
          <select
            value={kind}
            disabled={mode === 'edit'}
            onChange={(event) => { const next = event.target.value as DataKind; setKind(next); onStartCreate(next); }}
            className="w-full border border-border bg-background px-2 py-1 text-foreground disabled:opacity-60"
          >
            {(Object.keys(kindLabels) as DataKind[]).map((value) => <option key={value} value={value}>{kindLabels[value]}</option>)}
          </select>
        </label>

        <SectionHeader label="Bounds" count={pointsCount} />
        <div className="space-y-1 border border-border/60 bg-background/70 p-2 text-[11px] text-muted-foreground">
          <div>Click map: add point</div>
          <div>Click point: remove point</div>
          <div>Ctrl+click point, then click map: move point</div>
          <div>Click line segment: insert point between endpoints</div>
          <div>Esc: cancel without saving</div>
        </div>
        {bounds ? <BoundsReadout bounds={bounds} /> : <div className="text-xs text-muted-foreground">Add points to define bounds.</div>}

        {bounds && (
          <form key={`${mode}:${kind}:${data?._file ?? 'new'}`} className="space-y-3" onSubmit={submit}>
            <Field name="name" label="Name" required value={data?.name} />
            {kind !== 'areas_of_interest' && <Field name="country" label="Country" required value={getText(data, 'country')} />}
            {kind === 'ports' && <Select name="type" label="Type" values={portTypes} value={String(getValue(data, 'type') ?? portTypes[0])} />}
            {kind === 'areas_of_interest' && <Select name="type" label="Type" values={areaTypes} value={String(getValue(data, 'type') ?? areaTypes[0])} />}
            {kind === 'areas_of_interest' && <Field name="region" label="Region" required value={getText(data, 'region')} />}
            {kind === 'naval_bases' && <Field name="operator" label="Operator" required value={getText(data, 'operator')} />}
            {kind === 'ports' && <Field name="operator" label="Operator" value={getText(data, 'operator')} />}
            {kind !== 'areas_of_interest' && <Field name="nearest_city" label="Nearest City" value={getText(data, 'nearest_city')} />}

            {kind !== 'areas_of_interest' && <Select name="carrier_capable" label="Carrier Capable" values={carrier} value={String(getValue(data, 'carrier_capable') ?? carrier[0])} />}
            {kind === 'areas_of_interest' && <Select name="strategic_value" label="Strategic Value" values={strategic} value={String(getValue(data, 'strategic_value') ?? strategic[0])} />}
            {kind === 'areas_of_interest' && <TriBool name="carrier_navigable" label="Carrier Navigable" value={getBool(data, 'carrier_navigable')} />}
            {kind === 'naval_bases' && <TriBool name="homeport_for_carriers" label="Homeport For Carriers" value={getBool(data, 'homeport_for_carriers')} />}

            {kind !== 'areas_of_interest' && <Field name="max_ship_length_m" label="Max Ship Length M" type="number" value={getText(data, 'max_ship_length_m')} />}
            {kind !== 'areas_of_interest' && <Field name="max_ship_beam_m" label="Max Ship Beam M" type="number" value={getText(data, 'max_ship_beam_m')} />}
            {kind !== 'areas_of_interest' && <Field name="max_draught_m" label="Max Draught M" type="number" value={getText(data, 'max_draught_m')} />}
            {kind === 'ports' && <Field name="berth_depth_m" label="Berth Depth M" type="number" value={getText(data, 'berth_depth_m')} />}
            {kind === 'ports' && <Field name="channel_depth_m" label="Channel Depth M" type="number" value={getText(data, 'channel_depth_m')} />}
            {kind === 'naval_bases' && <Field name="pier_depth_m" label="Pier Depth M" type="number" value={getText(data, 'pier_depth_m')} />}
            {kind === 'naval_bases' && <Field name="dry_dock_length_m" label="Dry Dock Length M" type="number" value={getText(data, 'dry_dock_length_m')} />}
            {kind === 'areas_of_interest' && <Field name="min_depth_m" label="Min Depth M" type="number" value={getText(data, 'min_depth_m')} />}
            {kind === 'areas_of_interest' && <Field name="min_width_km" label="Min Width KM" type="number" value={getText(data, 'min_width_km')} />}

            <Field name="wikipedia_url" label="Wikipedia URL" value={data?.wikipedia_url} />
            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="tracking-tui uppercase">Notes</span>
              <textarea name="notes" defaultValue={data?.notes ?? ''} className="h-20 w-full border border-border bg-background px-2 py-1 text-foreground" />
            </label>
            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={saving}>Save</Button>
              <Button type="button" onClick={onClearPoints}>Clear Points</Button>
            </div>
            {message && <pre className="max-h-32 overflow-auto whitespace-pre-wrap text-[10px] text-muted-foreground">{message}</pre>}
          </form>
        )}
      </div>
    </Panel>
  );
}
