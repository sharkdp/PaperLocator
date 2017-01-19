<?php
$name = $_POST["name"];
$email = $_POST["email"];
$msg = $_POST["message"];
$subject = "Paper locator feedback";
$body = "Feedback from $name ($email):\n\n$msg";
if (mail("paperlocator@david-peter.de", $subject, $body, "From: paperlocator@david-peter.de")) {
    print "sent";
} else {
    print "error";
}
?>
