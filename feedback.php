<?php
$name = $_POST["name"];
$email = $_POST["email"];
$msg = $_POST["message"];
$subject = "Paper locator feedback";
$body = "Feedback from $name ($email):\n\n$msg";
if (mail("mail@paperlocator.com", $subject, $body, "From: mail@paperlocator.com")) {
    print "sent";
} else {
    print "error";
}
?>
