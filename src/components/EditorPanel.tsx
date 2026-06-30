import type * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { CircleHelp, X } from 'lucide-react';
import type { Bounds, DataKind, GeoItem } from '../data/types';
import { centerFromBounds, centerFromPoints } from '../lib/bounds';
import { Panel, SectionHeader, Button, Tooltip } from './ui';

const kindLabels: Record<DataKind, string> = {
  poi: 'Point of Interest',
  aoi: 'Area of Interest',
};

const poiTypes = ['naval_base', 'shipyard', 'port'];
const areaTypes = ['chokepoint', 'canal', 'sea_lane', 'operating_area'];
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

function listText(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function list(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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

function DrawHelp() {
  return (
    <Tooltip
      content={(
        <>
        <span className="block">select point + delete: remove the point</span>
        <span className="block">select point + drag: move the point</span>
        <span className="block">ctrl + drag: select points within a bounding box</span>
        <span className="block">shift + select points: select multiple points</span>
        <span className="block">click line segment: insert a new point in the middle</span>
        <span className="block">esc: cancel without saving</span>
        </>
      )}
    >
      <span tabIndex={0} className="inline-flex outline-none">
        <CircleHelp className="size-3.5 text-accent" aria-hidden="true" />
      </span>
    </Tooltip>
  );
}

function EditorTitle({ mode }: { mode: Mode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{mode === 'edit' ? 'Edit Area' : 'Create Area'}</span>
      <DrawHelp />
    </span>
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
  const [kind, setKind] = useState<DataKind>('poi');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const center = useMemo(() => (kind === 'aoi' ? centerFromPoints(points) : bounds ? centerFromBounds(bounds) : null), [bounds, kind, points]);
  const editing = mode === 'edit' ? selected : null;
  const data = editing?.data;
  const areaNeedsMorePoints = kind === 'aoi' && points.length > 0 && points.length < 3;
  const canSave = Boolean(bounds && center && !areaNeedsMorePoints);

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
    if (kind === 'aoi' && points.length < 3) return;

    const form = new FormData(event.currentTarget);
    const common = {
      name: text(form.get('name'), true),
      bounds,
      notes: text(form.get('notes')),
      wiki_url: text(form.get('wiki_url')),
    };

    const payload = kind === 'poi'
      ? {
        id: text(form.get('id'), true),
        name: text(form.get('name'), true),
        proper: text(form.get('proper'), true),
        type: String(form.get('type')),
        country: text(form.get('country'), true),
        operator: text(form.get('operator')),
        bounds: common.bounds,
        center,
        carriers: list(form.get('carriers')),
      }
      : {
          ...common,
          id: text(form.get('id'), true),
          bounds: common.bounds,
          poly: points,
          type: String(form.get('type')),
          region: text(form.get('region'), true),
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
      title={<EditorTitle mode={mode} />}
      className="flex max-h-[calc(100vh-20rem)] min-h-0 flex-col overflow-hidden"
      bodyClassName="flex-1 overflow-y-auto pb-0"
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
        {bounds ? <BoundsReadout bounds={bounds} /> : <div className="text-xs text-muted-foreground">Add points to define bounds.</div>}
        {areaNeedsMorePoints && <div className="text-xs text-destructive">Add at least 3 points to save an area.</div>}

        {bounds && (
          <form key={`${mode}:${kind}:${data?._file ?? 'new'}`} className="space-y-3" onSubmit={submit}>
            <Field name="name" label="Name" required value={data?.name} />
            {kind === 'poi' && <Field name="id" label="ID" required value={getText(data, 'id')} />}
            {kind === 'poi' && <Field name="proper" label="Proper Name" required value={getText(data, 'proper')} />}
            {kind === 'poi' && <Field name="country" label="Country" required value={getText(data, 'country')} />}
            {kind === 'poi' && <Select name="type" label="Type" values={poiTypes} value={String(getValue(data, 'type') ?? poiTypes[0])} />}
            {kind === 'aoi' && <Field name="id" label="ID" required value={getText(data, 'id')} />}
            {kind === 'aoi' && <Select name="type" label="Type" values={areaTypes} value={String(getValue(data, 'type') ?? areaTypes[0])} />}
            {kind === 'aoi' && <Field name="region" label="Region" required value={getText(data, 'region')} />}
            {kind === 'poi' && <Field name="operator" label="Operator" value={getText(data, 'operator')} />}

            {kind === 'aoi' && <Select name="strategic_value" label="Strategic Value" values={strategic} value={String(getValue(data, 'strategic_value') ?? strategic[0])} />}
            {kind === 'aoi' && <TriBool name="carrier_navigable" label="Carrier Navigable" value={getBool(data, 'carrier_navigable')} />}
            {kind === 'poi' && <Field name="carriers" label="Carriers" value={listText(getValue(data, 'carriers'))} />}

            {kind === 'aoi' && <Field name="wiki_url" label="Wiki URL" value={getText(data, 'wiki_url')} />}
            {kind === 'aoi' && (
              <label className="space-y-1 text-xs text-muted-foreground">
                <span className="tracking-tui uppercase">Notes</span>
                <textarea name="notes" defaultValue={String(getValue(data, 'notes') ?? '')} className="h-20 w-full border border-border bg-background px-2 py-1 text-foreground" />
              </label>
            )}
            <div className="sticky bottom-0 z-10 -mx-3 flex gap-2 border-t border-border bg-card px-3 py-3">
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
