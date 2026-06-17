import { DomEvent, type LeafletMouseEvent } from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, Pane, Polygon, Polyline, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import type { Bounds, DataKind, Point } from '../data/types';
import { leafletBounds, leafletPolygon } from '../lib/bounds';

type DragState = {
  indexes: Set<number>;
  start: Point;
  originalPoints: Point[];
};

type SelectBox = {
  start: Point;
  end: Point;
};

function segmentIndexes(kind: DataKind, points: Point[]) {
  const segments = points.slice(0, -1).map((_, index) => [index, index + 1] as const);
  if (kind === 'areas_of_interest' && points.length >= 3) segments.push([points.length - 1, 0]);
  return segments;
}

function pointBounds(a: Point, b: Point): Bounds {
  return {
    north: Math.max(a.lat, b.lat),
    south: Math.min(a.lat, b.lat),
    east: Math.max(a.lon, b.lon),
    west: Math.min(a.lon, b.lon),
  };
}

function indexesInBounds(points: Point[], bounds: Bounds) {
  return new Set(
    points
      .map((point, index) => ({ point, index }))
      .filter(({ point }) => point.lat <= bounds.north && point.lat >= bounds.south && point.lon <= bounds.east && point.lon >= bounds.west)
      .map(({ index }) => index),
  );
}

function withoutIndexes(points: Point[], indexes: Set<number>) {
  return points.filter((_, index) => !indexes.has(index));
}

function midpoint(a: Point, b: Point): Point {
  return {
    lat: (a.lat + b.lat) / 2,
    lon: (a.lon + b.lon) / 2,
  };
}

function EditPointEvents({
  dragging,
  selectBox,
  shouldSkipAddPoint,
  onAddPoint,
  onDrag,
  onEndGesture,
  onStartSelectBox,
  onUpdateSelectBox,
}: {
  dragging: DragState | null;
  selectBox: SelectBox | null;
  shouldSkipAddPoint: () => boolean;
  onAddPoint: (point: Point) => void;
  onDrag: (point: Point) => void;
  onEndGesture: () => void;
  onStartSelectBox: (point: Point) => void;
  onUpdateSelectBox: (point: Point) => void;
}) {
  useMapEvents({
    mousedown(event) {
      if (!event.originalEvent.ctrlKey && !event.originalEvent.metaKey) return;
      event.originalEvent.preventDefault();
      onStartSelectBox({ lat: event.latlng.lat, lon: event.latlng.lng });
    },
    mousemove(event) {
      const point = { lat: event.latlng.lat, lon: event.latlng.lng };
      if (dragging) {
        onDrag(point);
        return;
      }
      if (selectBox) onUpdateSelectBox(point);
    },
    mouseup() {
      if (dragging || selectBox) onEndGesture();
    },
    click(event) {
      if (event.originalEvent.ctrlKey || event.originalEvent.metaKey || dragging || selectBox || shouldSkipAddPoint()) return;
      onAddPoint({ lat: event.latlng.lat, lon: event.latlng.lng });
    },
  });

  return null;
}

function GestureMapDragToggle({ disabled }: { disabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!disabled) return;
    map.dragging.disable();
    return () => { map.dragging.enable(); };
  }, [disabled, map]);

  return null;
}

export function DevEditPointLayer({
  kind,
  points,
  bounds,
  onChangePoints,
  onInsertPoint,
}: {
  kind: DataKind | null;
  points: Point[];
  bounds: Bounds | null;
  onChangePoints: (points: Point[]) => void;
  onInsertPoint: (index: number, point: Point) => void;
}) {
  const [hoverPointIndex, setHoverPointIndex] = useState<number | null>(null);
  const [hoverSegmentIndex, setHoverSegmentIndex] = useState<number | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(() => new Set());
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [selectBox, setSelectBox] = useState<SelectBox | null>(null);
  const skipNextAddPoint = useRef(false);
  const selectBoxBounds = useMemo(() => selectBox ? pointBounds(selectBox.start, selectBox.end) : null, [selectBox]);
  const previewSelectedIndexes = useMemo(
    () => selectBoxBounds ? indexesInBounds(points, selectBoxBounds) : selectedIndexes,
    [points, selectBoxBounds, selectedIndexes],
  );

  useEffect(() => {
    setSelectedIndexes((current) => new Set([...current].filter((index) => index < points.length)));
  }, [points.length]);

  useEffect(() => {
    if (!kind) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      if (!selectedIndexes.size) return;
      event.preventDefault();
      onChangePoints(withoutIndexes(points, selectedIndexes));
      setSelectedIndexes(new Set());
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [kind, onChangePoints, points, selectedIndexes]);

  if (!kind) return null;

  function addPoint(point: Point) {
    onChangePoints([...points, point]);
    setSelectedIndexes(new Set([points.length]));
  }

  function startPointDrag(index: number, event: LeafletMouseEvent) {
    event.originalEvent.preventDefault();
    event.originalEvent.stopPropagation();
    if (event.originalEvent.shiftKey || event.originalEvent.ctrlKey || event.originalEvent.metaKey) return;
    const indexes = selectedIndexes.has(index) ? selectedIndexes : new Set([index]);
    setSelectedIndexes(indexes);
    setDragging({ indexes, start: { lat: event.latlng.lat, lon: event.latlng.lng }, originalPoints: points });
  }

  function togglePointSelection(index: number) {
    setSelectedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function shouldSkipAddPoint() {
    if (!skipNextAddPoint.current) return false;
    skipNextAddPoint.current = false;
    return true;
  }

  function insertSegmentPoint(from: number, to: number, event: LeafletMouseEvent) {
    DomEvent.stop(event.originalEvent);
    skipNextAddPoint.current = true;
    onInsertPoint(from + 1, midpoint(points[from], points[to]));
    setSelectedIndexes(new Set([from + 1]));
  }

  function dragPoints(point: Point) {
    if (!dragging) return;
    const latDelta = point.lat - dragging.start.lat;
    const lonDelta = point.lon - dragging.start.lon;
    onChangePoints(dragging.originalPoints.map((current, index) => (
      dragging.indexes.has(index) ? { lat: current.lat + latDelta, lon: current.lon + lonDelta } : current
    )));
  }

  function endGesture() {
    if (selectBoxBounds) setSelectedIndexes(indexesInBounds(points, selectBoxBounds));
    setDragging(null);
    setSelectBox(null);
  }

  return (
    <>
      <EditPointEvents
        dragging={dragging}
        selectBox={selectBox}
        shouldSkipAddPoint={shouldSkipAddPoint}
        onAddPoint={addPoint}
        onDrag={dragPoints}
        onEndGesture={endGesture}
        onStartSelectBox={(point) => setSelectBox({ start: point, end: point })}
        onUpdateSelectBox={(point) => setSelectBox((current) => current ? { ...current, end: point } : current)}
      />
      <GestureMapDragToggle disabled={dragging !== null || selectBox !== null} />
      <Pane name="dev-edit-fill" style={{ zIndex: 610 }}>
        {kind === 'areas_of_interest' && points.length >= 3 && (
          <Polygon
            positions={leafletPolygon(points)}
            pathOptions={{ color: '#ffffff', weight: 0, fillOpacity: 0.08, interactive: false }}
          />
        )}
        {kind !== 'areas_of_interest' && bounds && (
          <Rectangle
            bounds={leafletBounds(bounds)}
            pathOptions={{ color: '#ffffff', weight: 2, dashArray: '6 6', fillOpacity: 0.08, interactive: false }}
          />
        )}
      </Pane>
      <Pane name="dev-edit-segments" style={{ zIndex: 620 }}>
        {kind === 'areas_of_interest' && segmentIndexes(kind, points).map(([from, to], segmentIndex) => {
          const positions: [[number, number], [number, number]] = [[points[from].lat, points[from].lon], [points[to].lat, points[to].lon]];
          return (
            <Polyline
              key={`${from}:${to}`}
              positions={positions}
              pathOptions={{ color: hoverSegmentIndex === segmentIndex ? '#fff36d' : '#ffffff', dashArray: '6 6', opacity: hoverSegmentIndex === segmentIndex ? 1 : 0.9, weight: 2, interactive: false }}
            />
          );
        })}
      </Pane>
      <Pane name="dev-edit-hit-targets" style={{ zIndex: 630 }}>
        {kind === 'areas_of_interest' && segmentIndexes(kind, points).map(([from, to], segmentIndex) => {
          const positions: [[number, number], [number, number]] = [[points[from].lat, points[from].lon], [points[to].lat, points[to].lon]];
          return (
            <Polyline
              key={`${from}:${to}`}
              positions={positions}
              pathOptions={{ color: '#69e7ff', opacity: 0, weight: 18 }}
              eventHandlers={{
                mouseover: () => setHoverSegmentIndex(segmentIndex),
                mouseout: () => setHoverSegmentIndex((current) => current === segmentIndex ? null : current),
                click: (event: LeafletMouseEvent) => insertSegmentPoint(from, to, event),
              }}
            />
          );
        })}
      </Pane>
      <Pane name="dev-edit-selection" style={{ zIndex: 640 }}>
        {selectBoxBounds && (
          <Rectangle
            bounds={leafletBounds(selectBoxBounds)}
            pathOptions={{ color: '#69e7ff', weight: 1, dashArray: '4 4', fillColor: '#69e7ff', fillOpacity: 0.08, interactive: false }}
          />
        )}
      </Pane>
      <Pane name="dev-edit-points" style={{ zIndex: 650 }}>
        {points.map((point, index) => (
          <CircleMarker
            key={`${point.lat}:${point.lon}:${index}`}
            center={[point.lat, point.lon]}
            radius={previewSelectedIndexes.has(index) || hoverPointIndex === index ? 13 : 11}
            bubblingMouseEvents={false}
            pathOptions={{
              color: previewSelectedIndexes.has(index) ? '#ffffff' : hoverPointIndex === index ? '#fff36d' : '#ffffff',
              fillColor: previewSelectedIndexes.has(index) ? '#fff36d' : hoverPointIndex === index ? '#ffffff' : '#69e7ff',
              fillOpacity: 1,
              weight: 2,
            }}
            eventHandlers={{
              mouseover: () => setHoverPointIndex(index),
              mouseout: () => setHoverPointIndex((current) => current === index ? null : current),
              mousedown: (event) => startPointDrag(index, event),
              click: (event: LeafletMouseEvent) => {
                event.originalEvent.stopPropagation();
                if (event.originalEvent.shiftKey || event.originalEvent.ctrlKey || event.originalEvent.metaKey) {
                  togglePointSelection(index);
                  return;
                }
                setSelectedIndexes(new Set([index]));
              },
            }}
          />
        ))}
      </Pane>
    </>
  );
}
