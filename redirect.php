<?php
$query = $_GET["q"];

file_put_contents("failed_queries", date("Y-m-d H:i:s").": ".$query."\n", FILE_APPEND);

$url = "http://scholar.google.de/scholar?q=".urlencode("\"".$query."\"");
header("Location: ".$url);
exit;
?>
