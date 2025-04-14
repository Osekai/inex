#!/bin/bash
set -e

cd frontend
npm i
export ANTHERA_PRODUCTION=true
npx webpack
cd ..
tar -czf "app.tar.gz" "./frontend/dist"