<?php
$name = $_POST["name"];
$email = $_POST["email"];
$msg = $_POST["message"];
$subject = "Paper locator feedback";
$body = "Feedback from $name ($email):\n\n$msg";
if (mail("davidpeter@web.de", $subject, $body, "From: davidpeter@web.de")) {
    print "sent";
} else {
    print "error";
}
?>
