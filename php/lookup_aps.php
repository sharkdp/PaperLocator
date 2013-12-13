<?php
include "lookup.php";

$journal = $_GET["journal"];
$volume =  $_GET["volume"];
$page =    $_GET["page"];

/* $journal = "PRL"; */
/* $volume = "17"; */
/* $page = "1133"; */

$url = "http://link.aps.org/citesearch?journal=$journal&volume=$volume&article=$page";

$content = get_data($url);
preg_match('/<a href="([^"]*)">PDF<\/a>/', $content, $match);

if (count($match) > 1) {
    $path = $match[1];

    $splitURL = split("/", $path);
    $subdomain = strtolower($splitURL[2]);

    if ($subdomain == 'pr') {
        $subdomain = 'prola';
    }
    $rurl = "http://$subdomain.aps.org$path";
    print($rurl);
}
?>
