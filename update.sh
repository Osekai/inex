git pull
cd frontend || exit
npm ci
export ANTHERA_PRODUCTION=true
npx webpack
cd ..
composer i
