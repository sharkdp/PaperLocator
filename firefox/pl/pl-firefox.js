// Replace openURL
openURL = function (url) {
    var win = window.open(url, '_blank');
    if (win) {
        win.focus();
        $("#ffClosePanel").click(); // uaaahhhh
    }
}
