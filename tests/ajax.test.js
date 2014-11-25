
var redirectURL = false;

// overwrite this function. we don't want to open the url
function openURL(url) {
    redirectURL = url;
}

describe("showDocument", function () {
    it("should return the PDF link for 'PRL 17 1133'", function () {
        lastRecord = findRef("PRL 17 1133");
        showDocument();

        waitsFor(function() {
            return redirectURL !== false;
        }, "the AJAX callback to finish", 5000);

        runs(function() {
            expect(redirectURL)
                .toEqual('http://journals.aps.org/prl/pdf/10.1103/PhysRevLett.17.1133');
        });
    });
});
