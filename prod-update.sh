#!/bin/bash
set -e

ARTIFACT_PATH=$1

tar -xzf $ARTIFACT_PATH -C . --strip-components=1
rm $ARTIFACT_PATH
rm artifact.zip

git pull
git submodule update
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader
php vendor/bin/phinx migrate
php index.php task Update