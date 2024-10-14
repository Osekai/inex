<?php
if (!isset($router)) die("Do not call this directly!");

use Data\Comments;
use Data\Medals\MedalsBeatmaps;
use Data\OsekaiUsers;
use Data\Post\Edit;
use Data\Post\Gallery;
use Data\Votes;

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
        } catch (JsonException $e) {
            return false;
        }
    }
}


$router->post("/api/usersettings/set", function () {
    if (!checkPermRequirement("account.edit"))
        return;
    if (requireLogin()) {
        $value = $_POST['value'];
        if (json_validate($value)) $value = json_decode($value, true);
        echo Data\Settings::ApiSet($_POST['key'], $value)->ReturnJson();
    }
});


/// =====================
/// Medals
/// =====================

$router->all("/api/medals/get_all", function () {
    echo \Data\Medals::GetAll()->ReturnJson();
});
$router->all("/api/medals/{id}/save", function ($id) {
    if (!OsekaiUsers::HasPermission("medal.edit", false)) {
        echo "no perms";
        exit;
    }
    echo \Data\Medals::Save($id, $_REQUEST)->ReturnJson();
});


/// =====================
/// Medals Beatmaps
/// =====================

$router->all("/api/medals/beatmaps/{id}/delete", function ($id) {
    echo MedalsBeatmaps::Delete($id)->ReturnJson();
});
$router->all("/api/medals/beatmaps/{id}/admindelete", function ($id) {
    echo MedalsBeatmaps::AdminDelete($id)->ReturnJson();
});
$router->all("/api/medals/{id}/beatmaps", function ($id) {
    echo MedalsBeatmaps::GetBeatmaps($id)->ReturnJson();
});
$router->all("/api/medals/beatmaps/{id}/report", function ($id) {
    echo MedalsBeatmaps::ReportBeatmap($id, $_POST)->ReturnJson();
});
$router->all("/api/medals/{id}/packs", function ($id) {
    echo MedalsBeatmaps::GetPacks($id)->ReturnJson();
});
$router->all("/api/medals/{id}/beatmap/add", function ($id) {
    echo MedalsBeatmaps::AddBeatmap($_POST['url'], $id, $_POST['note'])->ReturnJson();
});


/// =====================
/// Comments
/// =====================

$router->all("/api/comments/post", function ($id) {
    echo Comments::Post($_POST['id'], $_POST['table'], $_POST['text'])->ReturnJson();
});
$router->all("/api/comments/{id}/report", function ($id) {
    echo Comments::Report($id, $_POST)->ReturnJson();
});
$router->all("/api/comments/{id}/delete", function ($id) {
    echo Comments::Delete($id)->ReturnJson();
});
$router->all("/api/comments/{id}/admindelete", function ($id) {
    echo Comments::AdminDelete($id)->ReturnJson();
});
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


/// =====================
/// Voting
/// =====================

$router->all("/api/vote/{target}/{id}", function ($target, $id) {
    echo Votes::Vote($target, $id)->ReturnJson();
});
