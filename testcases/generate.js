require("./input.js");

var fs = require('fs');

eval(fs.readFileSync('../parser.js')+'');

var out = 'var testCases = [\n';
var i;
var query;
var record;

for (i = 0; i < testQueries.length; i++) {
    query = testQueries[i];

    record = findRef(query);
    if (i !== 0) {
        out += ',\n\n';
    }
    // out = out + '    ["' + encodeURIComponent(query) +
    //             '", "' + encodeURIComponent(record.reference) + '"]';
    query = query.replace(/"/g, '\\"');
    out = out + '    ["' + query + '",\n' +
                '     "' + record.reference + '"]';

}

var out = out + '\n];';
console.log(out);

