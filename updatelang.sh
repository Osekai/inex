#!/bin/bash
php index.php task preparelocalization

cd public/lang
git add en_GB.json
git commit -m "auto: update lang"
git push
cd -

git add public/lang
git commit -m "auto: update lang"
