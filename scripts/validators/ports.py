"""Custom semantic validation for data/ports/*.json."""

from __future__ import annotations


def validate(json: dict) -> list[str]:
    errors: list[str] = []

    carrier_capable = json.get("carrier_capable")
    max_length = json.get("max_ship_length_m")
    max_beam = json.get("max_ship_beam_m")
    max_draught = json.get("max_draught_m")
    berth_depth = json.get("berth_depth_m")
    channel_depth = json.get("channel_depth_m")

    limiting_depths = [v for v in (max_draught, berth_depth, channel_depth) if v is not None]

    if carrier_capable == "yes":
        if max_length is not None and max_length < 250:
            errors.append("carrier_capable=yes is inconsistent with max_ship_length_m below 250")
        if max_beam is not None and max_beam < 35:
            errors.append("carrier_capable=yes is inconsistent with max_ship_beam_m below 35")
        if limiting_depths and min(limiting_depths) < 10:
            errors.append("carrier_capable=yes is inconsistent with limiting depth below 10 m")

    if carrier_capable == "no":
        large_enough = (
            max_length is not None
            and max_length >= 250
            and (max_beam is None or max_beam >= 35)
            and (not limiting_depths or min(limiting_depths) >= 10)
        )
        if large_enough:
            errors.append("carrier_capable=no is inconsistent with dimensions/depths that appear carrier-capable")

    if carrier_capable == "unknown" and any(v is not None for v in (max_length, max_beam, max_draught, berth_depth, channel_depth)):
        errors.append("carrier_capable=unknown should not include known carrier-limiting dimensions")

    return errors
