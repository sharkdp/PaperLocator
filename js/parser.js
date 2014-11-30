/*jslint vars:true, nomen: true, white: true*/

'use strict';

var Journal = function(regex, callback) {
    this.regex = [].concat(regex);
    this.callback = callback;
};

Journal.prototype.match = function(query) {
    var i, match;

    for (i = 0; i < this.regex.length; i += 1) {
        match = this.regex[i].exec(query);

        // see: [http://stackoverflow.com/questions/1520800/why-regexp-with-global-flag-in-javascript-give-wrong-results]
        this.regex[i].lastIndex = 0;

        if (match) {
            match.shift(); // we are not interested in match[0] = full match
            return this.callback.apply(this, match);
        }
    }
    return false;
};

// Match against typical [Issue] [Page] strings, like "11, 222" or "11 222".
// Numbers in brackets are ignored, e.g. "11 (1996) 222"
Journal.rSeperator = '(?:[^0-9a-z\\(\\)][^0-9\\(\\)]*|[^0-9\\(\\)]*\\([^\\)]*\\)[^0-9\\(\\)]*)';
Journal.rIssueAndPage = Journal.rSeperator +
                       '([0-9]+)' +  // Match issue
                       Journal.rSeperator +
                       '([0-9]+)';  // Match page number

function makeRecord(journal, reference, website, doc, ajaxCall) {
    if (journal === undefined) { journal = ''; }
    if (reference === undefined) { reference = ''; }
    if (website === undefined) { website = ''; }
    if (doc === undefined) { doc = ''; }
    return {
        'journal': journal,
        'reference': reference,
        'website': website,
        'document': doc,
        'ajaxCall': ajaxCall
    };
}

function replaceIssuePage(str, issue, page) {
    if (str === undefined) {
        return str;
    }
    str = str.replace('{issue}', issue);
    str = str.replace('{page}', page);
    return str;
}

function buildJournalRegExp(pattern) {
    // All <..> objects are turned into non-matching optionl groups (?:..)?
    pattern = pattern.replace(/</g, '(?:');
    pattern = pattern.replace(/>/g, ')?');

    // Transform spaces into a regexp for possible separators: ' ', ',', '-', '.', ':'
    pattern = pattern.replace(/ +/g, '[ ,\\-\\.:]*');

    // Attach the generic issue+page regex
    pattern += Journal.rIssueAndPage;

    // We require a word boundary at the beginning and the end
    pattern = '\\b' + pattern + '\\b';

    return new RegExp(pattern, 'ig');
}

function simpleJournal(pattern, journal, reference, website, doc, ajaxCall) {
    var regex = buildJournalRegExp(pattern);

    var callback = function(issue, page) {
        reference = replaceIssuePage(reference, issue, page);
        website   = replaceIssuePage(website,   issue, page);
        doc       = replaceIssuePage(doc,       issue, page);
        ajaxCall  = replaceIssuePage(ajaxCall,  issue, page);
        return makeRecord(journal, reference, website, doc, ajaxCall);
    };

    return new Journal(regex, callback);
}

function constructJournals() {
    var journals = [];

    // DOI
    journals.push(
        new Journal(
            new RegExp('\\b(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?!["&\'<>])\\S)+)\\b', 'g'),
            function(doi) {
                return makeRecord('DOI', doi, 'http://doi.org/' + doi);
            }
        )
    );

    // Search for arXiv ID
    var r_arXiv = new RegExp('\\barXiv:([0-9]{4,}\\.[0-9]{4,}(?:v[0-9]+)?)\\b', 'ig');
    var r_arXiv_old = new RegExp('\\barXiv: *(?:[a-z)]* )? *((?:[a-z-]+)/[0-9]+(?:v[0-9]+)?)\\b', 'ig');
    journals.push(
        new Journal(
            [r_arXiv, r_arXiv_old],
            function(id) {
                id = id.toLowerCase();

                return makeRecord(
                    'arXiv',
                    'arXiv:' + id,
                    'http://arxiv.org/abs/' + id,
                    'http://arxiv.org/pdf/' + id
                );
            }
        )
    );

    // APS references Phys. Rev. Lett. and Phys. Rev. A-Z
    journals.push(
        new Journal(
            buildJournalRegExp('P<hys<ical>> R<ev<iew>> (L<ett<ers?>>|[A-Z])'),
            function(journal, volume, page) {
                // Replace L, Lett., Letters, .. by L (short form) and 'Lett.' (long form)
                journal = journal.replace(/^[Ll]\w*/, "L").toUpperCase();
                var longjournal = journal.replace("L", "Lett.");

                return makeRecord(
                    'Phys. Rev. ' + longjournal,
                    'PR' + journal + ' <b>' + volume + '</b>, ' + page,
                    'http://journals.aps.org/search/?q=PR' + journal + '%20' + volume + ',%20' + page,
                    'doAJAX',
                    'php/lookup_aps.php?journal=PR' + journal + '&volume=' + volume + '&page=' + page
                );
            }
        )
    );

    // Rev. Mod. Phys.
    journals.push(
        new Journal(
            buildJournalRegExp('R<ev<iews?>> <of> M<od<ern>> P<hys<ics>>'),
            function(volume, page) {
                return makeRecord(
                    'Rev. Mod. Phys',
                    'RMP <b>' + volume + '</b>, ' + page,
                    'http://journals.aps.org/search/?q=RMP%20' + volume + ',%20' + page,
                    'doAJAX',
                    'php/lookup_aps.php?journal=RMP&volume=' + volume + '&page=' + page
                );
            }
        )
    );

    // Nature
    journals.push(
        new Journal(
            buildJournalRegExp('(Nat<ure> <Phys<ics>>)'),
            function(journal, volume, page) {
                var param = '';
                var arg = '';
                if (journal !== undefined && journal.search(/phys/i) !== -1) {
                    journal = 'Phys. ';
                    param = 'nphys&sp-q-9%5BNPHYS%5D';
                    arg = 'nphys';
                } else {
                    journal = '';
                    param = 'default';
                }

                return makeRecord(
                    'Nature',
                    'Nature ' + journal + '<b>' + volume + '</b>, ' + page,
                    'http://www.nature.com/search/executeSearch?sp-advanced=true&sp-m=0&siteCode=' + param + '&sp-p=all&&sp-p-2=all&&sp-p-3=all&sp-q-4=' + volume + '&sp-q-5=&sp-q-6=' + page + '&sp-date-range=0&sp-c=25',
                    'doAJAX',
                    'php/lookup_nature.php?journal=' + arg + '&volume=' + volume + '&page=' + page
                );
            }
        )
    );

    // Science
    journals.push(
        simpleJournal(
            'Science',
            'Science',
            'Science <b>{issue}</b>, {page}',
            'http://www.sciencemag.org/search?volume={issue}&firstpage={page}&submit=yes',
            'doAJAX',
            'php/lookup_science.php?&volume={issue}&page={page}'
        )
    );

    // Chemical Review
    journals.push(
        simpleJournal(
            'Chem<ical> R<ev<iews?>>',
            'Chemical Review',
            'Chem. Rev. <b>{issue}</b>, {page}',
            'http://pubs.acs.org/action/quickLink?quickLinkJournal=chreay&quickLinkVolume={issue}&quickLinkPage={page}'
        )
    );

    // J. Math. Phys
    journals.push(
        simpleJournal(
            'J<ournal> <of> M<ath<ematical>> P<hys<ics>>',
            'J. Math. Phys',
            'J. Math. Phys. <b>{issue}</b>, {page}',
            'http://scitation.aip.org/search?noRedirect=true&value8=Journal+of+Mathematical+Physics&option8=journalbooktitle&operator12=AND&option12=resultCategory&value12=ResearchPublicationContent&operator13=AND&option14=elocationpage&option13=prism_volume&operator14=AND&value13={issue}&value14={page}'
        )
    );

    // IOP: Journal of Physics X, New Journal of Physics, Reports on Progress in Physics
    var r_jphys = buildJournalRegExp('J<ournal> <of> P<hys<ics>> ([ABDG]|C<ond<ens<ed>>> <Mat<ter>>)');
    var r_njp = buildJournalRegExp('(N)<ew> J<our<nal>> <of> P<hys<ics>>');
    var r_repprogphys = buildJournalRegExp('(R)ep<orts?> <on> Prog<ress> <in> Phys<ics>');

    journals.push(
        new Journal(
            [r_jphys, r_njp, r_repprogphys],
            function(journal, volume, page) {
                journal = journal.toUpperCase();
                if (journal[0] === 'C') {
                    journal = 'C';
                }

                var journalName = 'Journal of Physics ' + journal;
                var shortName = 'J. Phys. ' + journal;
                if (journal === 'N') {
                    journalName = 'New Journal of Physics';
                    shortName = 'NJP';
                } else if (journal === 'R') {
                    shortName = journalName = 'Rep. Prog. Phys.';
                }

                // The IOP journals change their names all the time. We have to find the right journal
                // ID by comparing the issue of the reference to the following small database of the
                // form
                //   'Journal name' : {{volume, 'id'}, ...}
                // where 'volume' is the highest volume number with the corresponding journal ID. The
                // current ID is listed with volume set to 0.
                var iopJournals = {
                    'A' : {5: '0022-3689', 7: '0301-0015', 39: '0305-4470', 0: '1751-8121'},
                    'B' : {20: '0022-3700', 0: '0953-4075'},
                    'C' : {0: '0953-8984'}, // Condensed Matter
                    'D' : {18: '0508-3443', 0: '0022-3727'},
                    'G' : {14: '0305-4616', 0: '0954-3899'},
                    'R' : {0: '0034-4885'}, // Reports on Progress in Physics
                    'N' : {0: '1367-2630'} // New Journal of Physics
                };

                if (iopJournals.hasOwnProperty(journal)) {
                    var ids = iopJournals[journal];
                    var journalID = ids[0];
                    var volumen = parseInt(volume, 10);
                    var maxVol;
                    for (maxVol in ids) {
                        if (ids.hasOwnProperty(maxVol) && volumen <= maxVol) {
                            journalID = ids[maxVol];
                            break;
                        }
                    }

                    return makeRecord(
                        journalName,
                        shortName + ' <b>' + volume + '</b>, ' + page,
                        'http://iopscience.iop.org/findcontent?CF_JOURNAL=' + journalID + '&CF_VOLUME=' + volume + '&CF_ISSUE=&CF_PAGE=' + page + '&submit=Go&navsubmit=Go'
                    );
                }
                return false;
            }
        )
    );

    return journals;
}

var journals = constructJournals();

function findRef(query) {
    var i, res;

    if (query === undefined) {
        return makeRecord();
    }

    // Immediately return for empty queries
    query = query.trim();
    if (query === "") {
        return makeRecord();
    }

    // Try all available journals
    for (i = 0; i < journals.length; i += 1) {
        res = journals[i].match(query);
        if (res) {
            return res;
        }
    }

    // Found nothing -> redirect to Google scholar
    return makeRecord('', '', 'http://paperlocator.com/php/redirect.php?q=' + encodeURI(query));
}

// Export findRef for Node
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports.findRef = findRef;
}
