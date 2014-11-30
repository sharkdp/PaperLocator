#!/bin/bash

p="dist/"

# create new dist folder
rm -rf "$p"

mkdir "$p"
mkdir "$p/js"

# copy all assets
cp -r website/* "$p"
cp js/*.js "$p/js/"
cp -r tests/ "$p"
cp -r extensions/ "$p"
cp -r php/ "$p"

if [[ $1 == "--fast" ]]; then
    cp js/parser.js js/interface.js "$p/js/"
else
    # Minify JS files with Googles closure compiler
    closure --js js/parser.js    --js_output_file "$p/js/parser.min.js"
    closure --js js/interface.js --js_output_file "$p/js/interface.min.js"

    # replace js files by minified versions
    sed -i 's/parser\.js/parser.min.js/g' "$p/index.html"
    sed -i 's/interface\.js/interface.min.js/g' "$p/index.html"
fi

# update date in sitemap.xml
sed -i "s/<lastmod>[^<]*<\/lastmod>/<lastmod>$(date +'%Y-%m-%d')<\/lastmod>/g" "$p/sitemap.xml"

if [[ $1 == "--extensions" ]]; then
    # update browser extensions
    cp "website/pl.css" "$p/js/parser.min.js" "$p/js/interface.min.js" extensions/chrome/pl

    # merge differences in html files
    diffuse website/index.html extensions/chrome/pl/index.html
fi
