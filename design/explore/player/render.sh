#!/bin/sh
# Renders every option and the board with headless Edge: ./render.sh
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="$(cygpath -m "$PWD")"
shot() { "$EDGE" --headless=new --hide-scrollbars --virtual-time-budget=9000 --allow-file-access-from-files --screenshot="$DIR/renders/$1.png" --window-size=$2 "file:///$DIR/$3" >/dev/null 2>&1; }
shot current 1200,650 "option.html?o=current&v=desk"
shot a 1200,830 "option.html?o=a&v=desk"
shot b 1200,980 "option.html?o=b&v=desk"
shot c 1200,830 "option.html?o=c&v=desk"
for o in current a b c; do shot "phone-$o" 390,440 "option.html?o=$o&v=phone"; done
shot board 1400,4020 "index.html"
