"""Custom semantic validation for data/naval_bases/*.json."""

from __future__ import annotations


def validate(json: dict) -> list[str]:
    errors: list[str] = []

    carrier_capable = json.get("carrier_capable")
    homeport_for_carriers = json.get("homeport_for_carriers")
    max_length = json.get("max_ship_length_m")
    max_beam = json.get("max_ship_beam_m")
    max_draught = json.get("max_draught_m")
    pier_depth = json.get("pier_depth_m")
    dry_dock_length = json.get("dry_dock_length_m")

    limiting_depths = [v for v in (max_draught, pier_depth) if v is not None]

    if homeport_for_carriers is True and carrier_capable not in {"yes", "limited"}:
        errors.append("homeport_for_carriers=true requires carrier_capable=yes or limited")

    if carrier_capable == "yes":
        if max_length is not None and max_length < 250:
            errors.append("carrier_capable=yes is inconsistent with max_ship_length_m below 250")
        if max_beam is not None and max_beam < 35:
            errors.append("carrier_capable=yes is inconsistent with max_ship_beam_m below 35")
        if limiting_depths and min(limiting_depths) < 10:
            errors.append("carrier_capable=yes is inconsistent with limiting depth below 10 m")

    if dry_dock_length is not None and max_length is not None and dry_dock_length > max_length:
        errors.append("dry_dock_length_m should not exceed max_ship_length_m")

    if carrier_capable == "no" and homeport_for_carriers is True:
        errors.append("carrier_capable=no is inconsistent with homeport_for_carriers=true")

    return errors
