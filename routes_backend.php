<?php
if(!isset($router)) die("Do not call this directly!");

use Data\Post\Edit;
use Data\Post\Gallery;

if (!function_exists('json_validate')) {
    /**
     * Validates a JSON string.
     *
     * @param string $json The JSON string to validate.
     * @param int $depth Maximum depth. Must be greater than zero.
     * @param int $flags Bitmask of JSON decode options.
     * @return bool Returns true if the string is a valid JSON, otherwise false.
     */
    function json_validate($json, $depth = 512, $flags = 0)
    {
        if (!is_string($json)) {
            return false;
        }

        try {
            json_decode($json, false, $depth, $flags | JSON_THROW_ON_ERROR);
            return true;
        } catch (\JsonException $e) {
            return false;
        }
    }
}

$router->all("/api/comments/{section}/get", function ($section) {
    echo json_encode(Data\Comments::Get($section));
});

$router->all("/api/comments/{section}/send", function ($section) {
    if (!requireLogin()) return;
    $replyingTo = null;
    if (isset($_REQUEST['replyingTo'])) {
        $replyingTo = $_REQUEST['replyingTo'];
    }
    echo json_encode(Data\Comments::Send($section, $_REQUEST['content'], $replyingTo));
});

$router->all("/api/comment/{id}/delete", function ($id) {
    if (requireLogin())
        echo json_encode(Data\Comments::Delete($id));
});

$router->post("/api/usersettings/set", function () {
    if (!checkPermRequirement("account.edit"))
        return;
    if (requireLogin()) {
        $value = $_POST['value'];
        if (json_validate($value)) $value = json_decode($value, true);
        echo Data\Settings::ApiSet($_POST['key'], $value)->ReturnJson();
    }
});