function findRef(query) {
    var record = {journal: '', reference: '', website: '', document: ''};

    if (query === undefined) {
        return record;
    }

    query = query.trim();

    if (query === "") {
        return record;
    }

    // Create the RegExp objects locally to reset .lastIndex property
    // see: [http://stackoverflow.com/questions/1520800/why-regexp-with-global-flag-in-javascript-give-wrong-results]

    // Match against typical [Issue] [Page] strings, like "11, 222" or "11 222"
    // Numbers in brackets are ignored, e.g. "11 (1996) 222"
    var s_sep_or_brackets = '(?:[^0-9a-z\\(\\)][^0-9\\(\\)]*|[^0-9\\(\\)]*\\([^\\)]*\\)[^0-9\\(\\)]*)';
    var s_issue_and_page = s_sep_or_brackets +
                           '([0-9]+)' +  // Match issue
                           s_sep_or_brackets +
                           '([0-9]+)';  // Match page number

    var r_doi = new RegExp('\\b(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?!["&\'<>])\\S)+)\\b', 'g');
    var r_arXiv = new RegExp('\\barXiv:([0-9]{4,}\\.[0-9]{4,}(?:v[0-9]+)?)\\b', 'ig');
    var r_arXiv_old = new RegExp('\\barXiv:? *(?:[a-z)]* )? *((?:[a-z-]+)/[0-9]+(?:v[0-9]+)?)\\b', 'ig');
    var r_aps = new RegExp('\\b(?:P(?:hys(?:ical)?)?[\\., \\-]*R(?:ev(?:iew)?)?[\\., \\-]*([A-Z]|Lett(?:ers?)?|)' + s_issue_and_page + ')\\b', 'ig');
    var r_rmp = new RegExp('\\bR(?:ev)?(?:iew)?s?\\.? *(?:of)? *M(?:od)?(?:ern)?\\.? *P(?:hys)?(?:ics)?\\.?' + s_issue_and_page + '\\b', 'ig');
    var r_nature = new RegExp('\\b(?:Nat(?:ure)?\\.? *(Phys(?:ics)?\\.?)? *(?:\\([^\\)]+\\))?' + s_issue_and_page + ')\\b', 'ig');
    var r_science = new RegExp('\\b(?:Science *(?:\\([^\\)]+\\))?' + s_issue_and_page + ')\\b', 'ig');
    var r_jphys = new RegExp('\\bJ(?:ournal)?\\.? *(?:of)? *P(?:hys)?(?:ics)?[ \\.:]*([ABDG]|C(?:ond(?:ens(?:ed)?)?)[ \\.]*(?:Mat(?:ter)))' + s_issue_and_page + '\\b', 'ig');
    var r_njp = new RegExp('\\b(N)(?:ew)?\\.? *J(?:ournal)?\\.? *(?:of)? *P(?:hys)?(?:ics)?\\.?' + s_issue_and_page + '\\b', 'ig');
    var r_repprogphys = new RegExp('\\b(R)ep(?:orts?)?[\\. ]*(?:on)?[\\. ]*Prog(?:ress)?[\\. ]*(?:in)? *Phys(?:ics)?' + s_issue_and_page + '\\b', 'ig');
    var r_chemrev = new RegExp('\\bChem(?:\\.?|ical)?\\.? *R(?:ev)?(?:\\.?|iews?)' + s_issue_and_page + '\\b', 'ig');

    var m;

    // Search for DOI
    if (m = r_doi.exec(query)) {
        record.journal = 'DOI';
        record.reference = m[1];
        record.website = 'http://doi.org/' + m[1];
        return record;
    }

    // Search for arXiv ID
    if ((m = r_arXiv.exec(query)) || (m = r_arXiv_old.exec(query))) {
        var id = m[1].toLowerCase();
        record.journal = 'arXiv';
        record.reference = 'arXiv:' + id;
        record.website = 'http://arxiv.org/abs/' + id;
        record.document = 'http://arxiv.org/pdf/' + id;
        return record;
    }

    // Search for APS references
    if (m = r_aps.exec(query)) {
        var journal = m[1];
        var volume = m[2];
        var page = m[3];

        // Replace Lett./Letters etc by L
        journal = journal.replace(/^[Ll].*/, "L").toUpperCase();
        var longjournal = journal.replace("L", "Lett.");

        record.journal = 'Phys. Rev. ' + longjournal;
        record.reference = 'PR' + journal + ' <b>' + volume + '</b>, ' + page;
        record.website = 'http://link.aps.org/citesearch?journal=PR' + journal + '&volume=' + volume + '&article=' + page;
        record.document = 'doAJAX';
        record.ajaxCall = 'php/lookup_aps.php?journal=PR' + journal + '&volume=' + volume + '&page=' + page;
        return record;
    }

    // Search for Rev. Mod. Phys. references
    if (m = r_rmp.exec(query)) {
        var volume = m[1];
        var page = m[2];

        record.journal = 'Rev. Mod. Phys';
        record.reference = 'RMP <b>' + volume + '</b>, ' + page;
        record.website = 'http://link.aps.org/citesearch?journal=RMP&volume=' + volume + '&article=' + page;
        record.document = 'doAJAX';
        record.ajaxCall = 'php/lookup.aps?journal=RMP&volume=' + volume + '&page=' + page;
        return record;
    }

    // Search for Nature references
    if (m = r_nature.exec(query)) {
        var journal = m[1];
        var volume = m[2];
        var page = m[3];
        var param = '';
        if (typeof journal !== 'undefined' && journal.search(/phys/i) != -1) {
            journal = 'Phys. ';
            param = 'nphys';
        }
        else {
            journal = '';
            param = '';
        }

        record.journal = 'Nature';
        record.reference = 'Nature ' + journal + '<b>' + volume + '</b>, ' + page;
        record.website = 'http://www.nature.com/search/executeSearch?sp-advanced=true&sp-m=0&siteCode=' + param + '&sp-p=all&&sp-p-2=all&&sp-p-3=all&sp-q-4=' + volume + '&sp-q-5=&sp-q-6=' + page + '&sp-date-range=0&sp-c=25';
        record.document = 'doAJAX';
        record.ajaxCall = 'php/lookup_nature.php?journal=' + param + '&volume=' + volume + '&page=' + page;
        return record;
    }

    // Search for Science references
    if (m = r_science.exec(query)) {
        var volume = m[1];
        var page = m[2];

        record.journal = 'Science';
        record.reference = 'Science <b>' + volume + '</b>, ' + page;
        record.website = 'http://www.sciencemag.org/search?volume=' + volume + '&firstpage=' + page + '&submit=yes';
        record.document = 'doAJAX';
        record.ajaxCall = 'php/lookup_science.php?&volume=' + volume + '&page=' + page;
        return record;
    }

    // Search for IOP references
    if ((m = r_jphys.exec(query)) ||     // Journal of Physics *
        (m = r_njp.exec(query)) ||       // New Journal of Physics
        (m = r_repprogphys.exec(query))  // Reports on Progress in Physics
            ) {

        var journal = m[1].toUpperCase();
        var volume = m[2];
        var article = m[3];

        if (journal[0] === 'C') {
            journal = 'C';
        }

        var journalName = 'Journal of Physics ' + journal;
        var shortName = 'J. Phys. ' + journal;
        if (journal === 'N') {
            journalName = 'New Journal of Physics';
            shortName = 'NJP';
        }
        else if (journal === 'R') {
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
            var volumen = parseInt(volume, 10);
            var maxVol;
            for (maxVol in ids) {
                if (volumen <= maxVol) {
                    journalID = ids[maxVol];
                    break;
                }
            }
            record.journal = journalName;
            record.reference = shortName + ' <b>' + volume + '</b>, ' + article;
            record.website = 'http://iopscience.iop.org/findcontent?CF_JOURNAL=' + journalID + '&CF_VOLUME=' + volume + '&CF_ISSUE=&CF_PAGE=' + article + '&submit=Go&navsubmit=Go';
            return record;
        }
    }

    // Search for Chemical Review references
    if (m = r_chemrev.exec(query)) {
        var volume = m[1];
        var article = m[2];

        record.journal = 'Chemical Review';
        record.reference = 'Chem. Rev. <b>' + volume + '</b>, ' + article;
        record.website = 'http://pubs.acs.org/action/quickLink?quickLinkJournal=chreay&quickLinkVolume=' + volume + '&quickLinkPage=' + article;
        return record;
    }

    // Found nothing -> redirect to Google scholar
    record.website = 'http://paperlocator.com/php/redirect.php?q=' + encodeURI(query);
    return record;

}
