#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GODOT_DIR="$ROOT_DIR/godot"
OUT_DIR="$ROOT_DIR/public/godot/slingshot"

if ! command -v godot4 >/dev/null 2>&1 && ! command -v godot >/dev/null 2>&1; then
  echo "Error: godot4/godot command not found. Install Godot 4.x and export templates first." >&2
  exit 1
fi

GODOT_BIN="$(command -v godot4 || command -v godot)"

echo "Using: $GODOT_BIN"
"$GODOT_BIN" --headless --path "$GODOT_DIR" --export-release Web "$OUT_DIR/slingshot.html"

for artifact in slingshot.js slingshot.wasm slingshot.pck; do
  if [[ ! -f "$OUT_DIR/$artifact" ]]; then
    echo "Error: missing export artifact $artifact" >&2
    exit 1
  fi
done

echo "Export complete: $OUT_DIR"
