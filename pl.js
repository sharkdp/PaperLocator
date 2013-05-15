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

    // Enable footer buttons 
    $("#helpButton"      ).click(function() { toggleInfoBox("#help"); });
    $("#extensionsButton").click(function() { toggleInfoBox("#extensions"); });
    $("#githubButton"    ).click(function() { toggleInfoBox("#github"); });
    $("#feedbackButton, #messageLink").click(function() { toggleInfoBox("#feedback"); });

    // Feedback form
    $("#feedbackSubmit"  ).click(function() { sendFeedback(); });

    // Show help infobox if hash #intro is set
    if (window.location.hash == '#intro') {
        $("#help").delay(500).slideDown();
    }

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

function toggleInfoBox(id) {
    var $id = $(id);
    if ($id.is(":visible")) {
        $id.slideUp();
    }
    else {
        var $box = $("div.infobox:visible");
        if ($box.length > 0) {
            $box.slideUp(400, function () {
                $id.slideDown();
            });
        }
        else {
            $id.slideDown();
        }
    }
}

function sendFeedback() {
    $("body, #submitDocument").css("cursor", "progress");
    $.ajax({
        url: 'http://paperlocator.com/feedback.php',
        data: {
            name: $("#feedbackName").val(),
            email: $("#feedbackEmail").val(),
            message: $("#feedbackMessage").val()
        },
        type: 'POST'
    }).success(function(data) {
        $("#feedback").html('<p class="instr">Feedback sent</p><p>Thank you!</p>');
        $("body, #submitDocument").css("cursor", "default");
    }).error(function () {
        notify('Sending feedback failed');
        $("body, #submitDocument").css("cursor", "default");
    });
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
    var s_issue_and_page = '[^0-9a-z]*([0-9]+)(?:[^0-9\\(\\)]+)(?:\\([0-9 ]+\\)(?:[^0-9\\(\\)]+))?([0-9]+)';

    var r_doi = new RegExp('\\b(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?!["&\'<>])\\S)+)\\b', 'g');
    var r_arXiv = new RegExp('\\barXiv:([0-9]{4,}\\.[0-9]{4,}(?:v[0-9]+)?)\\b', 'ig');
    var r_arXiv_old = new RegExp('\\barXiv:? *(?:[a-z)]* )? *((?:[a-z-]+)/[0-9]+(?:v[0-9]+)?)\\b', 'ig');
    var r_aps = new RegExp('\\b(?:P(?:hys)?(?:\\.?|ical) *R(?:ev)?(?:\\.?|iew) *([A-Z]|Lett(?:\\.?|ers?)|)' + s_issue_and_page + ')\\b', 'ig');
    var r_rmp = new RegExp('\\bR(?:ev)?(?:iew)?\\.? *(?:of)? *M(?:od)?(?:ern)?\\.? *P(?:hys)?(?:ics)?\\.?' + s_issue_and_page + '\\b', 'ig');
    var r_nature = new RegExp('\\b(?:Nature *(Phys(?:ics)?\\.?)? *(?:\\([^\\)]+\\))?' + s_issue_and_page + ')\\b', 'ig');
    var r_science = new RegExp('\\b(?:Science *(?:\\([^\\)]+\\))?' + s_issue_and_page + ')\\b', 'ig');
    var r_jphys = new RegExp('\\bJ(?:ournal)?\\.? *(?:of)? *P(?:hys)?(?:ics)?[ \\.:]*([ABDG]|C(?:ond(?:ens(?:ed)?)?)[ \\.]*(?:Mat(?:ter)))[^a-z][^0-9]*' + s_issue_and_page + '\\b', 'ig');
    var r_njp = new RegExp('\\b(N)(?:ew)?\\.? *J(?:ournal)?\\.? *(?:of)? *P(?:hys)?(?:ics)?\\.?' + s_issue_and_page + '\\b', 'ig');
    var r_repprogphys = new RegExp('\\b(R)ep(?:orts?)?[\\. ]*(?:on)?[\\. ]*Prog(?:ress)?[\\. ]*(?:in)? *Phys(?:ics)?' + s_issue_and_page + '\\b', 'ig');
    var r_chemrev = new RegExp('\\bChem(?:\\.?|ical)?\\.? *R(?:ev)?(?:\\.?|iews?)' + s_issue_and_page + '\\b', 'ig');

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

    // Search for IOP references
    if ((m = r_jphys.exec(query)) ||     // Journal of Physics *
        (m = r_njp.exec(query)) ||       // New Journal of Physics
        (m = r_repprogphys.exec(query))  // Reports on Progress in Physics
            ) {

        var journal = m[1].toUpperCase();
        var volume = m[2];
        var article = m[3];

        if (journal[0] == 'C') {
            journal = 'C';
        }

        var journalName = 'Journal of Physics ' + journal;
        var shortName = 'J. Phys. ' + journal;
        if (journal == 'N') {
            journalName = 'New Journal of Physics';
            shortName = 'NJP';
        }
        else if (journal == 'R') {
            shortName = journalName = 'Rep. Prog. Phys.';
        }

        // The IOP journals change their names all the time.
        // We have to find the right journal ID by comparing
        // the іssue of the reference to the following small
        // database of the form
        // 'Journal name' : {{volume, 'id'}, ...}
        // where 'volume' is the highest volume number with the
        // corresponding journal ID. The current ID is listed
        // with volume set to 0.
        var iopJournals = {
            'A' : {5: '0022-3689', 7: '0301-0015', 39: '0305-4470', 0: '1751-8121'},
            'B' : {20: '0022-3700', 0: '0953-4075'},
            'C' : {0: '0953-8984'}, // Condensed Matter
            'D' : {18: '0508-3443', 0: '0022-3727'},
            'G' : {14: '0305-4616', 0: '0954-3899'},
            'R' : {0: '0034-4885'}, // Reports on Progress in Physics
            'N' : {0: '1367-2630'} // New Journal of Physics
        };

        if (journal in iopJournals) {
            var ids = iopJournals[journal];
            var journalID = ids[0];
            var volumen = parseInt(volume);
            for (var maxVol in ids) {
                if (volumen <= maxVol) {
                    journalID = ids[maxVol];
                    break;
                }
            }
            record["journal"] = journalName;
            record["reference"] = shortName + ' <b>' + volume + '</b>, ' + article;
            record["website"] = 'http://iopscience.iop.org/findcontent?CF_JOURNAL=' + journalID + '&CF_VOLUME=' + volume + '&CF_ISSUE=&CF_PAGE=' + article + '&submit=Go&navsubmit=Go';
            return true;
        }
    }

    // Search for Chemical Review references
    if (m = r_chemrev.exec(query)) {
        var volume = m[1];
        var article = m[2];

        record["journal"] = 'Chemical Review';
        record["reference"] = 'Chem. Rev. <b>' + volume + '</b>, ' + article;
        record["website"] = 'http://pubs.acs.org/action/quickLink?quickLinkJournal=chreay&quickLinkVolume=' + volume + '&quickLinkPage=' + article;
        return true;
    }

    // Found nothing -> redirect to Google scholar
    record["website"] = 'http://paperlocator.com/redirect.php?q=' + encodeURI(query);
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
                url: 'http://paperlocator.com/aps_lookup.php',
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
                else {
                    openURL(record["website"]);
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
