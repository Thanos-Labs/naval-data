"""Custom semantic validation for data/areas_of_interest/*.json."""

from __future__ import annotations


def _lon_in_bounds(lon: float, west: float, east: float) -> bool:
    if west <= east:
        return west <= lon <= east
    # Rectangle crosses the antimeridian.
    return lon >= west or lon <= east


def validate(json: dict) -> list[str]:
    errors: list[str] = []

    bounds = json.get("bounds") or {}
    center = json.get("center") or {}
    north = bounds.get("north")
    south = bounds.get("south")
    east = bounds.get("east")
    west = bounds.get("west")
    lat = center.get("lat")
    lon = center.get("lon")

    if north is not None and south is not None and north < south:
        errors.append("bounds.north must be greater than or equal to bounds.south")

    if None not in (north, south, lat) and not (south <= lat <= north):
        errors.append("center.lat must be inside bounds")

    if None not in (west, east, lon) and not _lon_in_bounds(lon, west, east):
        errors.append("center.lon must be inside bounds")

    min_depth_m = json.get("min_depth_m")
    carrier_navigable = json.get("carrier_navigable")
    if carrier_navigable is True and min_depth_m is not None and min_depth_m < 10:
        errors.append("carrier_navigable=true is inconsistent with min_depth_m below 10")

    min_width_km = json.get("min_width_km")
    if carrier_navigable is True and min_width_km is not None and min_width_km <= 0:
        errors.append("carrier_navigable=true requires positive min_width_km when known")

    return errors
