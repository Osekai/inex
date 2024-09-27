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

$router->all("/api/comments/{ref}/{section}/get", function ($ref, $section) {
    echo Data\Comments::Get($section, $ref, $_POST['ParentID'])->ReturnJson();
});

$router->all("/api/comments/{ref}/{section}/send", function ($ref, $section) {
    if (!requireLogin()) return;
    $replyingTo = null;
    if (isset($_REQUEST['replyingTo'])) {
        $replyingTo = $_REQUEST['replyingTo'];
    }
    echo json_encode(Data\Comments::Post($section, $ref, $_REQUEST['content'], $replyingTo));
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



$router->all("/api/medals/get_all", function () {
    echo \Data\Medals::GetAll()->ReturnJson();
});
$router->all("/api/medals/{id}/beatmaps", function ($id) {
    echo \Data\Medals::GetBeatmaps($id)->ReturnJson();
});

$router->all("/api/medals/{id}/beatmap/add", function ($id) {
    echo \Data\Medals::AddBeatmap($_POST['url'], $id, $_POST['note'])->ReturnJson();
});
$router->all("/api/medals/{id}/save", function ($id) {
    return;
    echo \Data\Medals::Save($id, $_REQUEST)->ReturnJson();
});
$router->all("/api/comments/post", function ($id) {
    echo \Data\Comments::Post($_POST['id'], $_POST['table'], $_POST['text'])->ReturnJson();
});
$router->all("/api/vote/{target}/{id}", function ($target, $id) {
    echo \Data\Votes::Vote($target, $id)->ReturnJson();
});
