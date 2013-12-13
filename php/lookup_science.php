<?php
include "lookup.php";

$volume =  $_GET["volume"];
$page =    $_GET["page"];

/* $volume = "320"; */
/* $page = "1601"; */

$url = "http://www.sciencemag.org/search?volume=$volume&firstpage=$page&submit=yes";
$content = get_data($url);
preg_match('/(\/content\/[^"]*pdf[^"]*)"/', $content, $match);

if (count($match) > 1) {
    $path = $match[1];
    $path = preg_replace("/\?sid=.*$/", "", $path);
    $rurl = "http://www.sciencemag.org".($path);

    print($rurl);
}
?>
