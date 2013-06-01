# create pl.min.js
bash compile.sh

# replace pl.js -> pl.min.js
sed -i 's/pl\.js/pl.min.js/g' index.html

# update browser extensions
cp pl.css pl.min.js chrome/pl
cp pl.css pl.min.js firefox/pl

# merge differences in html files
diffuse index.html chrome/pl/index.html
diffuse index.html firefox/pl/index.html
