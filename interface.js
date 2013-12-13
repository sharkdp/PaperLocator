var lastRecord = {journal: '', reference: '', website: '', document: ''};
var lastMessage = "";
var lastQuery = "";
var notificationOn = false;

function notify(message) {
    if (message === lastMessage) {
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
        url: 'http://paperlocator.com/php/feedback.php',
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

    if (query !== lastQuery) {
        lastQuery = query;
        lastRecord = findRef(query);

        if (lastRecord.journal != "" && lastRecord.reference != "") {
            notify('Detected <i>' + lastRecord.journal + '</i> reference:<br><div id="reference">' + lastRecord.reference + '</div>');
        }
    }
}

function journalWebsite() {
    if (lastRecord.website !== '') {
        openURL(lastRecord.website);
    }
}

function showDocument() {
    if (lastRecord.document !== '') {
        if (lastRecord.document === 'doAJAX' && lastRecord.ajaxCall !== "") {
            // Lookup PDF URL
            $("body, #submitDocument").css("cursor", "progress");
            $.ajax({
                url: 'http://paperlocator.com/' + lastRecord.ajaxCall,
                type: 'GET'
            }).success(function(data) {
                if ($.trim(data) != '') {
                    $("body, #submitDocument").css("cursor", "default");
                    openURL(data);
                }
                else {
                    openURL(lastRecord.website);
                }
            }).error(function () {
                notify('AJAX lookup failed');
                $("body, #submitDocument").css("cursor", "default");
                if (lastRecord.website !== '') {
                    openURL(lastRecord.website);
                }
            });
        }
        else {
            openURL(lastRecord.document);
        }
    }
    else if (lastRecord.website !== '') {
        openURL(lastRecord.website);
    }
}

function openURL(url) {
    // Use seperate function to support browser extensions
    location.href = url;
}

$(document).ready(function() {
    $("#submitWebsite").click(journalWebsite);
    $("#submitDocument").click(showDocument);

    var $query = $("#query");
    // Register return/enter events
    $query.keydown(function(e) {
            if (e.which === 13 || e.keyCode === 13) {
                if (e.ctrlKey) { // ctrl + enter
                    journalWebsite();
                }
                else { // enter
                    showDocument();
                }
            }
        });
    $query.keyup(lookup);

    // Enable middle-click paste. Use timeout for asynchronous event handling
    $query.mouseup(function() {setTimeout(lookup, 0);});

    $query.on('input propertychange paste', function() {setTimeout(lookup, 0);});

    // Do not run the following code in the extensions
    if ($("#help").length > 0) {
        // Enable footer buttons
        $("#helpButton"      ).click(function() { toggleInfoBox("#help"); });
        $("#extensionsButton").click(function() { toggleInfoBox("#extensions"); });
        $("#githubButton"    ).click(function() { toggleInfoBox("#github"); });
        $("#feedbackButton, #messageLink").click(function() { toggleInfoBox("#feedback"); });

        // Feedback form
        $("#feedbackSubmit"  ).click(function() { sendFeedback(); });

        // See if cookie is present
        var cookiePresent = false;
        if (navigator.cookieEnabled && document.cookie.indexOf("showIntro=false") != -1) {
            cookiePresent = true;
        }

        // Show help infobox if hash #intro is set or no cookie is present
        if (!cookiePresent || window.location.hash == '#intro') {
            $("#help").delay(500).slideDown();
        }

        // Set cookie to hide intro box in the future
        if (navigator.cookieEnabled) {
            var expDate = new Date();
            expDate.setDate(expDate.getDate() + 365);
            var cookieString = "showIntro=false; expires=" + expDate.toUTCString();
            document.cookie = cookieString;
        }
    }

    // Do initial lookup, in case back-button has been used
    // and query field is already filled
    lookup();
});
