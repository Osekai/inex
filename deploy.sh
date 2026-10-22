#!/bin/bash
set -e

cd frontend
npm i
export ANTHERA_PRODUCTION=true
npx webpack
node scripts/licences.js
cd ..
tar -czf "app.tar.gz" "./frontend/dist" "./frontend/licences.json"