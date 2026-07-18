import type * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { CircleHelp, Plus } from 'lucide-react';
import type { Bounds, DataKind, GeoItem } from '../data/types';
import { centerFromBounds, centerFromPoints } from '../lib/bounds';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select as SelectPrimitive, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SelectedItemPanel } from './SelectedItemPanel';
import { itemName } from './ItemTypeBadge';

const kindLabels: Record<DataKind, string> = {
  poi: 'Point of Interest',
  aoi: 'Area of Interest',
};

const poiTypes = ['naval_base', 'shipyard', 'port'];
const areaTypes = ['chokepoint', 'canal', 'sea_lane', 'operating_area'];
const strategic = ['low', 'medium', 'high', 'critical'];

type Mode = 'create' | 'edit';

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

function TextField({ name, label, type = 'text', required = false, value }: { name: string; label: string; type?: string; required?: boolean; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={value ?? ''} />
    </div>
  );
}

function SelectField({ name, label, values, value }: { name: string; label: string; values: string[]; value?: string }) {
  const items = values.map((option) => ({ label: option, value: option }));

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <SelectPrimitive items={items} name={name} defaultValue={value ?? values[0]}>
        <SelectTrigger id={name} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {values.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </SelectPrimitive>
    </div>
  );
}

function TriBool({ name, label, value }: { name: string; label: string; value?: boolean | null }) {
  return <SelectField name={name} label={label} values={['null', 'true', 'false']} value={boolValue(value)} />;
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
    <Tooltip>
      <TooltipTrigger type="button" aria-label="Drawing help" className="flex size-4 items-center justify-center">
        <CircleHelp className="size-3" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent side="left" className="flex w-64 flex-col items-start">
        <span className="block">select point + delete: remove the point</span>
        <span className="block">select point + drag: move the point</span>
        <span className="block">ctrl + drag: select points within a bounding box</span>
        <span className="block">shift + select points: select multiple points</span>
        <span className="block">click line segment: insert a new point in the middle</span>
        <span className="block">esc: cancel without saving</span>
      </TooltipContent>
    </Tooltip>
  );
}

function EditorTitle({ mode }: { mode: Mode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{mode === 'edit' ? 'Edit record' : 'Create record'}</span>
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
  onMutated,
}: {
  selected: GeoItem | null;
  bounds: Bounds | null;
  points: { lat: number; lon: number }[];
  pointsCount: number;
  onStartCreate: (kind: DataKind) => void;
  onStartEdit: (item: GeoItem) => void;
  onClose: () => void;
  onClearPoints: () => void;
  onMutated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [kind, setKind] = useState<DataKind>('poi');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    try {
      const response = await fetch(`/api/data/${kind}${file}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setMessage(await response.text());
        return;
      }

      onMutated();
      setOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    if (!selected.data._file) {
      setMessage('This record has no source filename. Rebuild the data collection before deleting it.');
      return;
    }
    if (!window.confirm(`Delete ${itemName(selected)}? This cannot be undone.`)) return;

    setDeleting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/data/${selected.kind}?file=${encodeURIComponent(selected.data._file)}`, { method: 'DELETE' });
      if (!response.ok) {
        setMessage(await response.text());
        return;
      }
      onMutated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setDeleting(false);
    }
  }

  if (!open) {
    if (selected) {
      return <SelectedItemPanel item={selected} error={message} deleting={deleting} onEdit={openEdit} onDelete={() => { void deleteSelected(); }} />;
    }

    return (
      <div className="flex justify-end">
        <Button onClick={openCreate} aria-label="Create record" className="bg-white">
          <Plus aria-hidden="true" /> Create
        </Button>
      </div>
    );
  }

  return (
    <Card size="sm" className="min-h-0 flex-1">
      <CardHeader>
        <CardTitle><EditorTitle mode={mode} /></CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto pb-1">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="kind">Kind</Label>
            <SelectPrimitive
              items={Object.entries(kindLabels).map(([value, label]) => ({ value, label }))}
              value={kind}
              disabled={mode === 'edit'}
              onValueChange={(value) => {
                if (!value) return;
                const next = value as DataKind;
                setKind(next);
                onStartCreate(next);
              }}
            >
              <SelectTrigger id="kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.keys(kindLabels) as DataKind[]).map((value) => <SelectItem key={value} value={value}>{kindLabels[value]}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </SelectPrimitive>
          </div>

          <div className="flex items-center gap-2">
            <span>Bounds</span>
            <Badge variant="secondary">{pointsCount}</Badge>
            <Separator className="flex-1" />
          </div>
          {bounds ? <BoundsReadout bounds={bounds} /> : <p className="text-sm text-muted-foreground">Add points to define bounds.</p>}
          {areaNeedsMorePoints && (
            <Alert variant="destructive">
              <AlertDescription>Add at least 3 points to save an area.</AlertDescription>
            </Alert>
          )}

          {bounds && (
            <form id="editor-form" key={`${mode}:${kind}:${data?._file ?? 'new'}`} onSubmit={submit}>
              <div className="flex flex-col gap-5">
                <TextField name="name" label="Name" required value={data?.name} />
                {kind === 'poi' && <TextField name="id" label="ID" required value={getText(data, 'id')} />}
                {kind === 'poi' && <TextField name="proper" label="Proper Name" required value={getText(data, 'proper')} />}
                {kind === 'poi' && <TextField name="country" label="Country" required value={getText(data, 'country')} />}
                {kind === 'poi' && <SelectField name="type" label="Type" values={poiTypes} value={String(getValue(data, 'type') ?? poiTypes[0])} />}
                {kind === 'aoi' && <TextField name="id" label="ID" required value={getText(data, 'id')} />}
                {kind === 'aoi' && <SelectField name="type" label="Type" values={areaTypes} value={String(getValue(data, 'type') ?? areaTypes[0])} />}
                {kind === 'aoi' && <TextField name="region" label="Region" required value={getText(data, 'region')} />}
                {kind === 'poi' && <TextField name="operator" label="Operator" value={getText(data, 'operator')} />}
                {kind === 'aoi' && <SelectField name="strategic_value" label="Strategic Value" values={strategic} value={String(getValue(data, 'strategic_value') ?? strategic[0])} />}
                {kind === 'aoi' && <TriBool name="carrier_navigable" label="Carrier Navigable" value={getBool(data, 'carrier_navigable')} />}
                {kind === 'poi' && <TextField name="carriers" label="Carriers" value={listText(getValue(data, 'carriers'))} />}
                {kind === 'aoi' && <TextField name="wiki_url" label="Wiki URL" value={getText(data, 'wiki_url')} />}
                {kind === 'aoi' && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" defaultValue={String(getValue(data, 'notes') ?? '')} />
                  </div>
                )}
                {message && (
                  <Alert variant="destructive">
                    <AlertDescription><pre className="max-h-32 overflow-auto whitespace-pre-wrap">{message}</pre></AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          )}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button type="submit" form="editor-form" disabled={saving || !canSave}>Save</Button>
        <Button type="button" variant="outline" onClick={onClearPoints} disabled={!pointsCount}>Clear Points</Button>
        <Button type="button" variant="ghost" className="ml-auto" onClick={close}>Cancel</Button>
      </CardFooter>
    </Card>
  );
}
