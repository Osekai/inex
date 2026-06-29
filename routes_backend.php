<?php
if (!isset($router)) die("Do not call this directly!");

use Ampra\IO;
use Data\Comments;
use Data\Medals\MedalsBeatmaps;
use Data\OsekaiUsers;
use Data\Post\Edit;
use Data\Post\Gallery;
use Data\Votes;
use Database\Connection;
use Database\Session;

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

function StartAPI() {
    function api_error($errno, $errstr, $errfile, $errline)
    {
        $critical_errors = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR;

        if (!($errno & $critical_errors)) {
            return false;
        }

        $url = $_SERVER['REQUEST_URI'] ?? '';
        $method = $_SERVER['REQUEST_METHOD'] ?? '';

        IO::Send("/sysops/alert", [
            "title" => "Critical Error Detected in API",
            "description" =>
                "**errno:** `$errno`\n" .
                "**file:** `$errfile`\n" .
                "**line:** `$errline`\n" .
                "**request:** `$method $url`\n" .
                "**message**: ```$errstr```".
                "**time:** " . date('c')
        ]);

        ob_get_flush();
        echo (new \API\Response(-1, "Unknown Error", [
            "errno" => $errno,
            "errstr" => $errstr,
            "errfile" => $errfile,
            "errline" => $errline
        ]))->ReturnJson();
        exit;
    }

    function api_fatal()
    {
        $error = error_get_last();

        if ($error !== null) {
            $errno  = $error['type'];
            $errstr  = $error['message'];
            $errfile = $error['file'];
            $errline = $error['line'];

            $fatal_errors = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR;

            if ($errno & $fatal_errors) {
                $url    = $_SERVER['REQUEST_URI'] ?? '';
                $method = $_SERVER['REQUEST_METHOD'] ?? '';

                IO::Send("/sysops/alert", [
                    "title" => "Fatal Error Detected in API",
                    "description" =>
                        "**errno:** `$errno`\n" .
                        "**file:** `$errfile`\n" .
                        "**line:** `$errline`\n" .
                        "**request:** `$method $url`\n" .
                        "**message**: ```$errstr```" .
                        "**time:** " . date('c')
                ]);

                // discard partial output, then send clean JSON
                if (ob_get_level() > 0) ob_end_clean();

                header('Content-Type: application/json');
                echo (new \API\Response(-1, "Fatal Error", [
                    "errno"   => $errno,
                    "errstr"  => $errstr,
                    "errfile" => $errfile,
                    "errline" => $errline
                ]))->ReturnJson();
            }
        }
    }


    register_shutdown_function("api_fatal");
    set_error_handler('api_error');
}
$path = $_SERVER['REQUEST_URI'];
if (str_starts_with($path, "/api/")) StartAPI();

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
$router->all("/api/medals/suggestions", function () {
    echo \Data\Medals::Suggestions()->ReturnJson();
});
$router->all("/api/medals/{id}/save", function ($id) {
    if (!requireLogin()) return;
    if (!OsekaiUsers::HasPermission("medal.edit", false)) {
        echo "no perms";
        exit;
    }
    echo \Data\Medals::Save($id, $_REQUEST)->ReturnJson();
});
$router->all("/api/medals/{id}/extra", function ($id) {
    echo \Data\Medals::GetExtraData($id)->ReturnJson();
});

/// =====================
/// Medals Beatmaps
/// =====================

$router->all("/api/medals/beatmaps/{id}/delete", function ($id) {
    if (!requireLogin()) return;
    echo MedalsBeatmaps::Delete($id)->ReturnJson();
});
$router->all("/api/medals/beatmaps/{id}/admindelete", function ($id) {
    if (!requireLogin()) return;
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
    if (!requireLogin()) return;
    echo MedalsBeatmaps::AddBeatmap($_POST['url'], $id, $_POST['note'])->ReturnJson();
});


/// =====================
/// Comments
/// =====================

$router->all("/api/comments/post", function ($id) {
    if (!requireLogin()) return;
    echo Comments::Post($_POST['id'], $_POST['table'], $_POST['text'])->ReturnJson();
});
$router->all("/api/comments/{id}/report", function ($id) {
    echo Comments::Report($id, $_POST)->ReturnJson();
});
$router->all("/api/comments/{id}/delete", function ($id) {
    if (!requireLogin()) return;
    echo Comments::Delete($id)->ReturnJson();
});
$router->all("/api/comments/{id}/admindelete", function ($id) {
    if (!requireLogin()) return;
    echo Comments::AdminDelete($id)->ReturnJson();
});
$router->all("/api/comments/{id}/pin", function ($id) {
    if (!requireLogin()) return;
    echo Comments::Pin($id)->ReturnJson();
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


/// =====================
/// Badges
/// =====================

$router->all("/api/badges/get_all", function () {
    echo \Data\Badges::GetAll()->ReturnJson();
});


/// =====================
/// Rankings
/// =====================

$router->all("/api/rankings/get", function () {
    $type = $_REQUEST['type'] ?? '';
    $options = $_REQUEST['options'] ?? [];
    $offset = $_REQUEST['offset'] ?? 0;
    echo \Data\Rankings::GetRanking($type, $options, 50, $offset)->ReturnJson();
});
$router->all("/api/rankings/add", function () {
    echo \Data\Rankings::AddUser($_POST['id'])->ReturnJson();
});

/// =====================
/// Profiles
/// =====================

$router->all("/api/profiles/{id}", function ($id) {
    echo \Data\Profiles::Get($id)->ReturnJson();
});


$router->all("/api/notifications", function () {
    echo Data\Notifications\Utils::Get(50, $_POST['offset'])->ReturnJson();
});

$router->all("/api/notifications/readall", function () {
    Data\Notifications\Utils::SetRead(json_decode($_POST['items']));
});


/// ======================
/// Error Reporting
/// ======================
///

$router->post("/api/js_error", function () {
    $msg = $_REQUEST['message'] ?? '';
    $url = $_REQUEST['url'] ?? '';
    $line = $_REQUEST['line'] ?? '';
    $col = $_REQUEST['col'] ?? '';
    $stack = $_REQUEST['stack'] ?? '';
    $href = $_REQUEST['href'] ?? '';
    $path = $_REQUEST['path'] ?? '';
    $search = $_REQUEST['search'] ?? '';
    $hash = $_REQUEST['hash'] ?? '';
    $referrer = $_REQUEST['referrer'] ?? '';
    $userAgent = $_REQUEST['userAgent'] ?? '';
    $platform = $_REQUEST['platform'] ?? '';
    $lang = $_REQUEST['lang'] ?? '';
    $time = $_REQUEST['time'] ?? date('c');

    IO::Send("/sysops/alert", [
        "title" => "⚠️ FRONTEND Error Detected by " . Session::UserData()['id'],
        "description" => implode("\n", [
            "# **Page Info**",
            "href: `$href`",
            "path: `$path`",
            "search: `$search `",
            "hash: `$hash `",
            "referrer: `$referrer`",
            "",
            "# **Error Details**",
            "url: `$url`",
            "line: `$line`, col: `$col`",
            "message:\n```$msg```",
            $stack ? "stack:\n```$stack```" : "",
            "",
            "# **Client Info**",
            "userAgent: `$userAgent`",
            "platform: `$platform`",
            "lang: `$lang`",
            "time: $time"
        ])
    ]);
});

$router->post("/api/feedback/bug", function () {
    // https://github.com/anthera-art/web/blob/main/routing/backend.php#L946
    if(!Session::LoggedIn()) return;
    $nullableFloat = fn($key) => isset($_POST[$key]) && $_POST[$key] !== '' ? (float)$_POST[$key] : null;
    $nullableInt = fn($key) => isset($_POST[$key]) && $_POST[$key] !== '' ? (int)$_POST[$key] : null;
    $nullableBool = fn($key) => isset($_POST[$key]) && $_POST[$key] !== '' ? filter_var($_POST[$key], FILTER_VALIDATE_BOOLEAN) : null;
    $str = fn($key, $default = '') => trim($_POST[$key] ?? $default);

    // TODO: we probably shouldn't send *all* of this, lol - bit too much info for osekai (fine for anthera)
    $item = [
        "UserAgent" => $_SERVER['HTTP_USER_AGENT'] ?? $str('userAgent'),
        "Url" => $str('url'),
        "Referrer" => $str('referrer'),
        "Viewport" => $str('viewport'),
        "Screen" => $str('screen'),
        "DevicePixelRatio" => $nullableFloat('devicePixelRatio'),
        "ColorDepth" => $nullableInt('colorDepth'),
        "Language" => $str('language'),
        "Timezone" => $str('timezone'),
        "Memory" => $nullableFloat('memory'),
        "Cores" => $nullableInt('cores'),
        "Online" => $nullableBool('online'),
        "Problem" => $str('problem'),
        "Reproduce" => $str('reproduce'),
        "Expected" => $str('expected'),
        "Priority" => $str('priority', 'medium'),
        "Type" => $str('type', 'unknown'),
        "TypeReadable" => $str('readableType', $str('type', 'unknown')),
        "Timestamp" => date('c'),
        "UserTimestamp" => $str('timestamp'),
        "Secret" => md5(str_replace('-', '', bin2hex(openssl_random_pseudo_bytes(16)))),
        "Creator" => Session::UserData()['id']
    ];
    print_r($_FILES);

    Connection::insert("UserFeedback_Bug", $item);

    $item["UserData"] = [
        "id" => Session::UserData()['id'],
        "username" => Session::UserData()['username'],
    ];

    IO::Send("/feedback/bug", $item);
});

$router->post("/api/feedback/feedback", function () {
    // https://github.com/anthera-art/web/blob/main/routing/backend.php#L986
    if(!Session::LoggedIn()) return;
    $str = fn($key, $default = '') => trim($_POST[$key] ?? $default);
    $nullableFloat = fn($key) => isset($_POST[$key]) && $_POST[$key] !== '' ? (float)$_POST[$key] : null;

    $item = [
        "Feedback" => $str('feedback'),
        "Rating" => $nullableFloat('rating'),
        "Priority" => $str('priority', 'medium'),
        "Type" => $str('type', 'unknown'),
        "TypeReadable" => $str('readableType', $str('type', 'unknown')),
        "Timestamp" => date('c'),
        "UserTimestamp" => $str('timestamp'),
        "Secret" => md5(str_replace('-', '', bin2hex(openssl_random_pseudo_bytes(16)))),
        "Creator" => Session::UserData()['id']
    ];

    Connection::insert("UserFeedback_Feedback", $item);

    $item["UserData"] = [
        "id" => Session::UserData()['id'],
        "username" => Session::UserData()['username'],
    ];

    IO::Send("/feedback/feedback", $item);
});