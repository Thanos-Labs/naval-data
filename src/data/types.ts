export type DataKind = 'ports' | 'naval_bases' | 'areas_of_interest';

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

export type Port = CollectionMeta & {
  name: string;
  country: string;
  type: 'commercial' | 'military' | 'dual_use' | 'shipyard' | 'terminal';
  bounds: Bounds;
  location: Point;
  nearest_city: string | null;
  operator: string | null;
  max_ship_length_m: number | null;
  max_ship_beam_m: number | null;
  max_draught_m: number | null;
  berth_depth_m: number | null;
  channel_depth_m: number | null;
  carrier_capable: 'yes' | 'no' | 'limited' | 'unknown';
  notes: string | null;
  wikipedia_url: string | null;
};

export type NavalBase = CollectionMeta & {
  name: string;
  country: string;
  operator: string;
  bounds: Bounds;
  location: Point;
  nearest_city: string | null;
  max_ship_length_m: number | null;
  max_ship_beam_m: number | null;
  max_draught_m: number | null;
  pier_depth_m: number | null;
  dry_dock_length_m: number | null;
  carrier_capable: 'yes' | 'no' | 'limited' | 'unknown';
  homeport_for_carriers: boolean | null;
  notes: string | null;
  wikipedia_url: string | null;
};

export type AreaOfInterest = CollectionMeta & {
  name: string;
  type: 'strait' | 'canal' | 'chokepoint' | 'sea_lane' | 'sea' | 'gulf' | 'bay' | 'operating_area';
  region: string;
  bounds: Bounds;
  center: Point;
  min_depth_m: number | null;
  min_width_km: number | null;
  strategic_value: 'low' | 'medium' | 'high' | 'critical';
  carrier_navigable: boolean | null;
  notes: string | null;
  wikipedia_url: string | null;
};

export type GeoItem =
  | { kind: 'ports'; data: Port }
  | { kind: 'naval_bases'; data: NavalBase }
  | { kind: 'areas_of_interest'; data: AreaOfInterest };

export type LayerVisibility = Record<DataKind, boolean>;
