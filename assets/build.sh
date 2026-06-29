#!/usr/bin/env bash
# requires imagemagick(-full) >= 7.1.2
set -eu
mkdir -p output/client output/web output/tmp

colours=('purple' 'pink' 'red' 'bronze' 'silver' 'gold' 'blue' 'grey' 'green')
offset='+10+4'
export offset

process_medal() {
    local file_path="$1"
    local base_colour="$2"
    local file
    file=$(basename "$file_path")
    local name="${file%.*}"

    export INKSCAPE_APP_ID_TAG="p$$_${BASHPID}"

    magick "output/tmp/client-$base_colour.png" -background none "$file_path" -composite -resize 385x417 "output/client/${name}@2x.png"
    magick "output/tmp/client-$base_colour.png" -background none "$file_path" -composite -resize 193x209 "output/client/${name}.png"
    magick "output/tmp/web-$base_colour.png"    -background none "$file_path" -geometry "$offset" -composite -resize 248x248 "output/web/${name}@2x.png"
    magick "output/tmp/web-$base_colour.png"    -background none "$file_path" -geometry "$offset" -composite -resize 111x119 "output/web/${name}.png"

    echo "* $file_path"
}
export -f process_medal

process_colour() {
    local base_colour="$1"
    echo "Processing $base_colour medals..."

    export INKSCAPE_APP_ID_TAG="p$$_${BASHPID}"
    magick -background none "base/medal-$base_colour.svg" "output/tmp/client-$base_colour.png"
    magick base/dropshadow.png -resize 408x439 -background none "base/medal-$base_colour.svg" -geometry "$offset" -composite "output/tmp/web-$base_colour.png"

    # fan out icons in parallel only after base images are ready
    printf '%s\n' "$base_colour"/*.svg | xargs -P"$(nproc)" -I{} bash -c 'process_medal "$@"' _ {} "$base_colour"
}

for colour in "${colours[@]}"; do
    process_colour "$colour"
done

rm -r output/tmp