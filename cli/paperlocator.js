var exec = require('child_process').exec;

var fs = require('fs');
eval(fs.readFileSync('parser.min.js')+'');

var args = process.argv.splice(2);
var query = args.join(' ');

var record = findRef(query);

if (record.reference !== "") {
    var ref = record.reference.replace(/<(?:.|\n)*?>/gm, '');

    var bold = "\x1b[01m";
    var reset = "\x1b[0m";

    console.log(bold + "Journal:    " + reset + record.journal);
    console.log(bold + "Reference:  " + reset + ref);
    if (record.website !== "") {
        console.log(bold + "Website:    " + reset + record.website);
        exec("xdg-open '" + record.website + "'");
    }
}
else {
    console.log("Could not find any reference");
}

