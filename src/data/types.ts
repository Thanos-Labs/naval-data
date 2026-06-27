export type FacilityType = 'naval_base' | 'shipyard' | 'port';
export type FacilityLayerKind = 'ports' | 'naval_bases' | 'shipyards';
export type DataKind = 'poi' | 'areas_of_interest';
export type OverlayKind = 'ocean_seas' | 'world_eez';
export type LayerKind = FacilityLayerKind | 'areas_of_interest' | OverlayKind;

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
  name: string;
  type: 'strait' | 'canal' | 'chokepoint' | 'sea_lane' | 'sea' | 'gulf' | 'bay' | 'operating_area';
  region: string;
  bounds: Point[];
  center: Point;
  min_depth_m: number | null;
  min_width_km: number | null;
  strategic_value: 'low' | 'medium' | 'high' | 'critical';
  carrier_navigable: boolean | null;
  notes: string | null;
  wikipedia_url: string | null;
};

export type GeoItem =
  | { kind: 'poi'; data: PointOfInterest }
  | { kind: 'areas_of_interest'; data: AreaOfInterest };

export type LayerVisibility = Record<LayerKind, boolean>;
