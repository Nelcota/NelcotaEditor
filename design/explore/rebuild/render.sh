#!/bin/sh
# Renders a mock with headless Edge: ./render.sh <name> <w,h> [query]
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="$(cygpath -m "$PWD")"
mkdir -p renders
"$EDGE" --headless=new --hide-scrollbars --virtual-time-budget=6000 --allow-file-access-from-files --screenshot="$DIR/renders/$1$3.png" --window-size=$2 "file:///$DIR/$1.html?$3" >/dev/null 2>&1
