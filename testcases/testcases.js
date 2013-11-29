
function generateTestCases() {
    document.write('Copy the following code to the file <code>output.js</code>. This generates test cases for all input queries defined in <code>input.js</code> with their <i>current</i> results. After modifying the core code, come back and <a href="run.html">run the test cases</a>.<br /><br />');
    document.write('<textarea style="width: 100%; height: 500px;">');
    var res;

    document.write('var testCases = [\n');
    $.each(testQueries, function(i, ref) {
        res = findRef(ref);
        if (i !== 0) {
            document.write(',\n    ');
        }
        document.write('    ["' + encodeURIComponent(ref) +
            '", "' + encodeURIComponent(record['reference']) + '"]');
    });
    document.write('\n];');

    document.write('</textarea>');
}


var showAll = false; // Show also the ones which passed

function runTestCases() {
    var res;
    var numFailed = 0;
    var numCases = testCases.length;

    document.body.innerHTML = '';

    document.write('Running ' + numCases + ' test cases ... (Go <a href="generate.html">here</a> to update the test cases, after checking the output below)<br /><br />');

    if (showAll) {
        document.write('<a href="javascript:showAll=false; runTestCases();">Show only failed tests</a><br /><br />');
    }
    else {
        document.write('<a href="javascript:showAll=true; runTestCases();">Show all tests</a><br /><br />');
    }

    $.each(testCases, function(i, tc) {
        query = decodeURIComponent(tc[0]);
        oldRef = decodeURIComponent(tc[1]);
        res = findRef(query);
        if (showAll || record['reference'] != oldRef) {
            document.write('Test case: <i>' + query + '</i><br><pre>');
            document.write('<span style="color: red">Old reference</span>: ' + oldRef + '<br>');
            document.write('<span style="color: green">New reference</span>: ' + record['reference'] + '<br>');
            document.write('<span style="color: green">Journal</span>:       ' + record['journal'] + '<br>');
            document.write('<span style="color: green">Website</span>:       <a href="' + record['website'] + '">' + record['website'] + '</a><br>');
            document.write('</pre><br><br>');
            numFailed += 1;
        }
    });

    if (numFailed == 0) {
        document.write('<b>All tests passed!</b>');
    } 
    else {
        document.write('<br /><b>Number of failed tests: ' + numFailed + '</b>');
    } 
}
