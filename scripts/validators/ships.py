"""Custom semantic validation for data/ships/*.json."""

from __future__ import annotations

CURRENT_YEAR = 2026


def _year(value: str | None) -> int | None:
    if not value:
        return None
    try:
        return int(value[:4])
    except ValueError:
        return None


def validate(json: dict) -> list[str]:
    errors: list[str] = []

    in_service = json.get("in_service")
    date_decommissioned = json.get("date_decommissioned")
    decommissioning_reason = json.get("decommissioning_reason")
    date_commissioned = json.get("date_commissioned")

    has_decommission_marker = bool(date_decommissioned or decommissioning_reason)
    if has_decommission_marker and in_service is not False:
        errors.append(
            "decommissioned ships must have in_service=false when "
            "date_decommissioned or decommissioning_reason is set"
        )

    if in_service is True and has_decommission_marker:
        errors.append(
            "in_service=true ships must not have date_decommissioned or "
            "decommissioning_reason set"
        )

    commissioned_year = _year(date_commissioned)
    if (
        in_service is False
        and not has_decommission_marker
        and commissioned_year is not None
        and commissioned_year <= CURRENT_YEAR
    ):
        errors.append(
            "commissioned ships with no decommissioning date/reason should usually "
            "have in_service=true"
        )

    if decommissioning_reason is None and date_decommissioned is not None:
        errors.append("date_decommissioned is set but decommissioning_reason is null")

    return errors
