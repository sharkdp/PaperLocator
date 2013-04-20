$(document).ready(function() {
    $("#submitWebsite").click(journalWebsite);
    $("#submitDocument").click(showDocument);
    
    var $query = $("#query");
    // Register return/enter events
    $query.keypress(function(e) {
            if (e.which == 13 || e.keyCode == 13) { showDocument(); }
        });
    $query.keyup(lookup);

    // Enable middle-click paste. Use timeout for asynchronous event handling
    $query.mouseup(function() {setTimeout(lookup, 0);});

    var $hb = $("#helpButton");
    $hb.mouseover(function() { this.src = 'help_blue.png'; });
    $hb.mouseout(function() { this.src = 'help.png'; });
    $hb.click(function() { $("#help").fadeToggle(); }); 
    
    // Do initial lookup, in case back-button has been used
    // and query field is already filled
    lookup();
});

var record = {journal: '', reference: '', website: '', document: ''};
var lastMessage = "";
var notificationOn = false;

function notify(message) {
    if (message == lastMessage) {
        return;
    }
    lastMessage = message;
    var $div = $("#notification");
    $div.html("<p>" + message + "</p>");
    if (!notificationOn) {
        notificationOn = true;
        $div.slideToggle().delay(3000).slideToggle({complete: function() {notificationOn = false;}});
    }
}

function lookup() {
    var query = $("#query").val();
    var res = findRef(query);
    
    if (res && record["journal"] != "" && record["reference"] != "") {
        notify('Found ' + record["journal"] + ' reference:<br><div id="reference">' + record["reference"] + '</div>');
    }
    
    return res;
}

function findRef(query) {
    query = $.trim(query);

    if (query == "") {
        return false;
    }

    record["journal"] = '';
    record["reference"] = '';
    record["website"] = '';
    record["document"] = '';

    // Create the RegExp objects locally to reset .lastIndex property
    // see: [http://stackoverflow.com/questions/1520800/why-regexp-with-global-flag-in-javascript-give-wrong-results]

    // Match against typical [Issue] [Page] strings, like "11, 222" or "11 222"
    // Numbers in brackets are ignored, e.g. "11 (33) 222"
    var s_issue_and_page = '([0-9]+)(?:[^0-9\\(\\)]+)(?:\\([0-9 ]+\\)(?:[^0-9\\(\\)]+))?([0-9]+)';

    var r_doi = new RegExp('\\b(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?!["&\'<>])\\S)+)\\b', 'g');
    var r_arXiv = new RegExp('\\barXiv:([0-9]{4,}\\.[0-9]{4,}(?:v[0-9]+)?)\\b', 'ig');
    var r_arXiv_old = new RegExp('\\barXiv:? *(?:[a-z)]* )? *((?:[a-z-]+)/[0-9]+(?:v[0-9]+)?)\\b', 'ig');
    var r_aps = new RegExp('(?:P(?:hys)?(?:\\.?|ical) *R(?:ev)?(?:\\.?|iew) *([A-Z]|Lett(?:\\.?|ers?)|) *' + s_issue_and_page + ')\\b', 'ig');
    var r_rmp = new RegExp('R(?:ev)?(?:iew)?\\.? *(?:of)? *M(?:od)?(?:ern)?\\.? *P(?:hys)?(?:ics)?\\.? *' + s_issue_and_page + '\\b', 'ig');
    var r_nature = new RegExp('(?:Nature *(Phys(?:ics)?\\.?)? *(?:\\([^\\)]+\\))? ?' + s_issue_and_page + ')\\b', 'ig');
    var r_science = new RegExp('(?:Science *(?:\\([^\\)]+\\))? ?' + s_issue_and_page + ')\\b', 'ig');
    var r_njp = new RegExp('N(?:ew)?\\.? *J(?:ournal)?\\.? *(?:of)? *P(?:hys)?(?:ics)?\\.? *' + s_issue_and_page + '\\b', 'ig');

    var m, res = '';

    // Search for DOI
    if (m = r_doi.exec(query)) {
        record["journal"] = 'DOI';
        record["reference"] = m[1];
        record["website"] = 'http://doi.org/' + m[1];
        return true;
    }

    // Search for arXiv ID
    if ((m = r_arXiv.exec(query)) || (m = r_arXiv_old.exec(query))) {
        var id = m[1].toLowerCase();
        record["journal"] = 'arXiv';
        record["reference"] = 'arXiv:' + id;
        record["website"] = 'http://arxiv.org/abs/' + id;
        record["document"] = 'http://arxiv.org/pdf/' + id;
        return true;
    }

    // Search for APS references
    if (m = r_aps.exec(query)) {
        var journal = m[1];
        var volume = m[2];
        var article = m[3];

        // Replace Lett./Letters etc by L
        journal = journal.replace(/^L.*/, "L").toUpperCase();
        var longjournal = journal.replace("L", "Lett.");

        record["journal"] = 'Phys. Rev. ' + longjournal;
        record["reference"] = 'PR' + journal + ' <b>' + volume + '</b>, ' + article;
        record["website"] = 'http://link.aps.org/citesearch?journal=PR' + journal + '&volume=' + volume + '&article=' + article;
        record["document"] = 'doAJAX';
        return true;
    }

    // Search for Rev. Mod. Phys. references
    if (m = r_rmp.exec(query)) {
        var volume = m[1];
        var article = m[2];

        record["journal"] = 'Rev. Mod. Phys';
        record["reference"] = 'RMP <b>' + volume + '</b>, ' + article;
        record["website"] = 'http://link.aps.org/citesearch?journal=RMP&volume=' + volume + '&article=' + article;
        record["document"] = 'doAJAX';
        return true;
    }
    
    // Search for Nature references
    if (m = r_nature.exec(query)) {
        var journal = m[1];
        var volume = m[2];
        var article = m[3];
        var param = '';
        if (typeof journal !== 'undefined' && journal.search(/phys/i) != -1) {
            journal = 'Phys. ';
            param = 'nphys&sp-q-9%5BNPHYS%5D';
        }
        else {
            journal = '';
            param = 'default';
        }

        record["journal"] = 'Nature';
        record["reference"] = 'Nature ' + journal + '<b>' + volume + '</b>, ' + article;
        record["website"] = 'http://www.nature.com/search/executeSearch?sp-advanced=true&sp-m=0&siteCode=' + param + '&sp-p=all&&sp-p-2=all&&sp-p-3=all&sp-q-4=' + volume + '&sp-q-5=&sp-q-6=' + article + '&sp-date-range=0&sp-c=25';
        return true;
    }

    // Search for Science references
    if (m = r_science.exec(query)) {
        var volume = m[1];
        var article = m[2];

        record["journal"] = 'Science';
        record["reference"] = 'Science <b>' + volume + '</b>, ' + article;
        record["website"] = 'http://www.sciencemag.org/search?volume=' + volume + '&firstpage=' + article + '&submit=yes';
        return true;
    }

    // Search for NJP / JP* references
    if (m = r_njp.exec(query)) {
        var volume = m[1];
        var article = m[2];

        record["journal"] = 'New Journal of Physics';
        record["reference"] = 'NJP <b>' + volume + '</b>, ' + article;
        record["website"] = 'http://iopscience.iop.org/findcontent?CF_JOURNAL=1367-2630&CF_VOLUME=' + volume + '&CF_ISSUE=&CF_PAGE=' + article + '&submit=Go&navsubmit=Go';
        return true;
    }
    
    // Search for other '[Mag] Issue, Page' references
    // TODO

    // Found nothing -> Google scholar
    record["website"] = 'http://scholar.google.de/scholar?q=' + encodeURI('"' + query + '"');
    return false;

}

function journalWebsite() {
    if (record["website"] != '') {
        openURL(record["website"]);
    }
}

function showDocument() {
    if (record["document"] != '') {
        if (record["document"] == 'doAJAX' && record["website"] != "") {
            // Lookup PDF URL for APS references
            $("body, #submitDocument").css("cursor", "progress");
            $.ajax({
                url: 'http://david-peter.de/pl/aps_lookup.php',
                data: {url: encodeURI(record["website"])},
                type: 'GET'
            }).success(function(data) {
                if ($.trim(data) != '') {
                    var splitURL = data.split("/");
                    var subdomain = splitURL[2].toLowerCase();
                    if (subdomain == 'pr') {
                        subdomain = 'prola';
                    }
                    $("body, #submitDocument").css("cursor", "default");
                    openURL('http://' + subdomain + '.aps.org' + data);
                }
            }).error(function () {
                notify('AJAX lookup failed');
                $("body, #submitDocument").css("cursor", "default");
            });
        }
        else {
            openURL(record["document"]);
        }
    }
    else if (record["website"] != '') {
        openURL(record["website"]);
    }
}

function openURL(url) {
    // Use seperate function to support browser extensions
    location.href = url;
}
