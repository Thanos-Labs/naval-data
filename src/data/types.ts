export type FacilityType = 'naval_base' | 'shipyard' | 'port';
export type FacilityLayerKind = 'ports' | 'naval_bases' | 'shipyards';
export type DataKind = 'poi' | 'aoi';
export type OverlayKind = 'ocean_seas' | 'world_eez';
export type LayerKind = FacilityLayerKind | 'aoi' | OverlayKind;

export type Point = {
  lat: number;
  lon: number;
};

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type CollectionMeta = {
  _file?: string;
};

export type PointOfInterest = CollectionMeta & {
  id: string;
  name: string;
  proper: string;
  type: FacilityType;
  country: string;
  operator: string | null;
  bounds: Bounds;
  center: Point;
  carriers: string[];
};

export type AreaOfInterest = CollectionMeta & {
  id: string;
  name: string;
  type: 'chokepoint' | 'canal' | 'sea_lane' | 'operating_area';
  region: string;
  bounds: Bounds;
  poly: Point[];
  strategic_value: 'low' | 'medium' | 'high' | 'critical';
  carrier_navigable: boolean | null;
  notes: string | null;
  wiki_url: string | null;
};

export type GeoItem =
  | { kind: 'poi'; data: PointOfInterest }
  | { kind: 'aoi'; data: AreaOfInterest };

export type LayerVisibility = Record<LayerKind, boolean>;
