#!/bin/bash
php index.php task preparelocalization

cd public/lang
if ! git diff --quiet; then
    git add en_GB.json
    git commit -m "auto: update lang"
    git push
fi
cd -

git add public/lang
git commit -m "auto: update lang"
