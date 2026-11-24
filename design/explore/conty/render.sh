#!/bin/sh
# Renders the mock with headless Edge: ./render.sh <out-name> <w,h> <query>
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="$(cygpath -m "$(dirname "$0")")"
mkdir -p "$DIR/renders"
"$EDGE" --headless=new --hide-scrollbars --virtual-time-budget=6000 --allow-file-access-from-files --force-device-scale-factor=1 --screenshot="$DIR/renders/$1.png" --window-size=$2 "file:///$DIR/mock.html?$3" >/dev/null 2>&1
