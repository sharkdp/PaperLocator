/*global testQueries*/

'use strict';

require("./input.js");
var parser = require("../js/parser.js");

var i;
var query;
var record;
var out = 'var testCases = [\n';


for (i = 0; i < testQueries.length; i += 1) {
    query = testQueries[i];

    record = parser.findRef(query);
    if (i !== 0) {
        out += ',\n\n';
    }

    query = query.replace(/"/g, '\\"');
    out = out + '    ["' + query + '",\n' +
                '     "' + record.reference + '"]';

}

out = out + '\n];';
console.log(out);

