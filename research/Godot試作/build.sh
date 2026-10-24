#!/bin/sh
set -e
cd /home/claude/proto/proj
../../godot/godot --headless --path . --import >/dev/null 2>&1 || true
../../godot/godot --headless --path . --export-release "Web" ../build/web/index.html 2>&1 | grep -i -E "error" || true
ls -la ../build/web/index.pck
