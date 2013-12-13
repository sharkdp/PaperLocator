<?php
include "lookup.php";

$journal = $_GET["journal"];
$volume =  $_GET["volume"];
$page =    $_GET["page"];

/* $journal = "nphys"; */
/* $volume = "9"; */
/* $page = "795"; */

if ($journal == "nphys") {
    $param = "nphys&sp-q-9%5BNPHYS%5D";
}

$url = "http://www.nature.com/search/executeSearch?sp-advanced=true&sp-m=0&siteCode=$param&sp-p=all&&sp-p-2=all&&sp-p-3=all&sp-q-4=$volume&sp-q-5=&sp-q-6=$page&sp-date-range=0&sp-c=25";

$content = get_data($url);
preg_match('/<a href="([^"]*)" class="result-title">/', $content, $match);

if (count($match) > 1) {
    $rurl = $match[1];
    $rurl = str_replace("/full/", "/pdf/", $rurl);
    $rurl = str_replace(".html", ".pdf", $rurl);

    print($rurl);
}
?>
