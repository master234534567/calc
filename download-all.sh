#!/bin/bash

echo "--- Pulling Offline HTML Games Pack ---"
git clone --depth 1 --filter=blob:none --sparse https://github.com/CoolDude2349/Offline-HTML-Games-Pack.git pack_temp
cd pack_temp && git sparse-checkout set offline && cd ..
mkdir -p offline-games
cp -r pack_temp/offline/* offline-games/
rm -rf pack_temp

echo "--- Pulling Gams ---"
git clone --depth 1 https://github.com/Gams-Offline/Gams.git gams_temp
mkdir -p gams
cp -r gams_temp/* gams/
rm -rf gams_temp

echo "--- Pulling UBG42 ---"
git clone --depth 1 --filter=blob:none --sparse https://github.com/UBGHyper/ubg42.github.io.git ubg_temp
cd ubg_temp && git sparse-checkout set games && cd ..
mkdir -p ubg-games
cp -r ubg_temp/games/* ubg-games/
rm -rf ubg_temp

echo "--- Complete! ---"
