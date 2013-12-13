function checkRef(query, oldRef) {
    var record = findRef(query);
    it("reference '" + query + "'", function() {
        expect(record.reference).toEqual(oldRef);
    });
}

describe("Plain", function() {
    var i, tc, query, oldRef;
    for(i = 0; i < testCases.length; i++) {
        tc = testCases[i];
        query = tc[0];
        oldRef = tc[1];
        checkRef(query, oldRef);
    }
});

describe("Adding noise to", function() {
    noiseLeft = [
        "123 456 ",
        "(",
        "can be found at [42] ",
        "can be found at (42) ",
    ];
    noiseRight = [
        " 123 456",
        ")",
        " (2006)",
        " [12]",
    ];

    var i, j;

    for (i = 0; i < noiseLeft.length; i++) {
        for (j = 0; j < noiseRight.length; j++) {
            var k, tc, query, oldRef;
            for(k = 0; k < testCases.length; k++) {
                tc = testCases[k];
                query = tc[0];
                oldRef = tc[1];
                checkRef(noiseLeft[i] + query + noiseRight[j], oldRef);
            }
        }
    }
});

// Special cases
describe("findRef", function () {
    var empty = {journal: '', reference: '', website: '', document: ''};

    it("should return an empty reference", function () {
        expect(findRef("")).toEqual(empty);
        expect(findRef("\t")).toEqual(empty);
        expect(findRef("    ")).toEqual(empty);
        expect(findRef(undefined)).toEqual(empty);
    });

    it("should point to Scholar if no ref was found", function () {
        expect(findRef("No reference here").website)
            .toEqual('http://paperlocator.com/php/redirect.php?q=No%20reference%20here');
    });
});
