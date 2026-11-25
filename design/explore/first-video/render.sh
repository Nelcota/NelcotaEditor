#!/bin/sh
# Renders every option and the board with headless Edge: ./render.sh
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="$(cygpath -m "$PWD")"
shot() { "$EDGE" --headless=new --hide-scrollbars --virtual-time-budget=6000 --allow-file-access-from-files --screenshot="$DIR/renders/$1.png" --window-size=$2 "file:///$DIR/$3" >/dev/null 2>&1; }
for o in current a b c; do
    shot "$o" 1200,620 "option.html?o=$o&v=desk"
    shot "phone-$o" 390,800 "option.html?o=$o&v=phone"
done
shot board 1400,2900 "index.html"
