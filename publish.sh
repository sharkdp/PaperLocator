# create pl.min.js
bash compile.sh

# replace pl.js -> pl.min.js
sed -i 's/parser\.js/parser.min.js/g' index.html
sed -i 's/interface\.js/interface.min.js/g' index.html

# update browser extensions
cp pl.css parser.min.js interface.min.js chrome/pl
cp pl.css parser.min.js interface.min.js firefox/pl

# merge differences in html files
diffuse index.html chrome/pl/index.html
diffuse index.html firefox/pl/index.html
