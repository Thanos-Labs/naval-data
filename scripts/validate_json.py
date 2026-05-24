#!/usr/bin/env python3
"""Validate JSON files in a data subdirectory against a JSON Schema."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Iterable

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "target",
        help="Data subdirectory name, e.g. 'ships', or a path to a JSON data directory.",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        help="Schema path. Defaults to data/<target>.schema.json, then <target>/schema.json.",
    )
    return parser.parse_args()


def resolve_target(target: str) -> Path:
    raw = Path(target)
    if raw.exists():
        return raw
    data_target = DATA_DIR / target
    if data_target.exists():
        return data_target
    raise SystemExit(f"Data target not found: {target}")


def resolve_schema(data_path: Path, schema_arg: Path | None) -> Path:
    if schema_arg is not None:
        if not schema_arg.exists():
            raise SystemExit(f"Schema not found: {schema_arg}")
        return schema_arg

    candidates = [
        data_path.with_name(f"{data_path.name}.schema.json"),
        data_path / "schema.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise SystemExit(
        "Schema not found. Tried: " + ", ".join(str(path) for path in candidates)
    )


def json_files(data_path: Path, schema_path: Path) -> Iterable[Path]:
    for path in sorted(data_path.rglob("*.json")):
        if path.resolve() != schema_path.resolve():
            yield path


def format_path(path_parts: Iterable[object]) -> str:
    path = "$"
    for part in path_parts:
        if isinstance(part, int):
            path += f"[{part}]"
        else:
            path += f".{part}"
    return path


def main() -> int:
    args = parse_args()
    data_path = resolve_target(args.target)
    schema_path = resolve_schema(data_path, args.schema)

    with schema_path.open("r", encoding="utf-8") as f:
        schema = json.load(f)
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)

    files = list(json_files(data_path, schema_path))
    if not files:
        print(f"No JSON files found under {data_path}", file=sys.stderr)
        return 1

    failures = 0
    for path in files:
        try:
            with path.open("r", encoding="utf-8") as f:
                payload = json.load(f)
        except json.JSONDecodeError as exc:
            failures += 1
            print(f"{path}: invalid JSON: {exc}", file=sys.stderr)
            continue

        errors = sorted(
            validator.iter_errors(payload),
            key=lambda error: list(error.absolute_path),
        )
        if errors:
            failures += 1
            for error in errors:
                print(
                    f"{path}: {format_path(error.absolute_path)}: {error.message}",
                    file=sys.stderr,
                )

    if failures:
        print(f"Validation failed: {failures}/{len(files)} files invalid", file=sys.stderr)
        return 1

    print(f"Validation passed: {len(files)} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
