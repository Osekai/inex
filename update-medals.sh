#!/bin/bash
# pulls new medals from osu-resources and generates their json + pngs
set -e

cd "$(dirname "$0")/scripts"

if [ ! -d node_modules ]; then
    npm ci
fi

node add_medals.js "$@"
