# create pl.min.js
bash compile.sh

# update date in sitemap.xml
sed -i 's/<lastmod>[^<]*<\/lastmod>/<lastmod>'`date +"%Y-%m-%d"`'<\/lastmod>/g' sitemap.xml

# replace pl.js -> pl.min.js
sed -i 's/parser\.js/parser.min.js/g' index.html
sed -i 's/interface\.js/interface.min.js/g' index.html

# update browser extensions
cp pl.css parser.min.js interface.min.js chrome/pl
cp pl.css parser.min.js interface.min.js firefox/pl

# update CLI version
cp parser.min.js cli

# merge differences in html files (unless no-diff option is set -nd)
if [ x"$1" != x"-nd" ]; then
    diffuse index.html chrome/pl/index.html
    diffuse index.html firefox/pl/index.html
fi
