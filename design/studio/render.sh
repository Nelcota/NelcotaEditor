#!/bin/sh
# Renders every Studio board with headless Edge: sh render.sh
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="$(cygpath -m "$PWD")"
shot() { "$EDGE" --headless=new --hide-scrollbars --virtual-time-budget=12000 --allow-file-access-from-files --screenshot="$DIR/renders/$1.png" --window-size=$2 "file:///$DIR/board.html?b=$3" >/dev/null 2>&1; }
shot 1.0-studio-default 1200,1060 default
shot 1.1-studio-loading 1200,1000 loading
shot 1.2-studio-not-ready 1200,560 not-ready
shot 1.3-studio-rendering 1200,1060 rendering
shot 1.4-studio-render-failed 1200,1130 failed
shot 1.5-studio-rendered 1200,1060 rendered
shot 1.6-studio-no-preview 1200,1060 no-preview
shot 1.7-studio-offline 1200,1130 offline
shot 2.0-studio-sheet-parts 1200,1700 sheet
shot 2.1-studio-sheet-dialogs 1200,560 dialogs
for b in default rendering style trim; do shot "3.$b-studio-phone" 500,1100 "phone-$b"; done
true
