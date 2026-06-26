<?php

use Ampra\IO;
use Database\Connection;
use Database\Session;

if(!isset($router)) die("Do not call this directly!");

function BasePage($name)
{
    DrawViewWithTemplate($name, "page");
}
function Page($name)
{
    return function () use ($name) {
        Site::$am_frontend = true;
        BasePage($name);
    };
}
function LoginPage($name)
{
    return function () use ($name) {
        Site::$am_frontend = true;
        if (requireLogin())
            BasePage($name);
    };
}



// Basic //



$router->get('/', function () {
    DrawViewWithTemplate("home", "page");
});


$router->get('/medals', function () {
    DrawViewWithTemplate("medals", "page");
});
$router->get('/medals/{medal}/', function ($medal) {
    DrawViewWithTemplate("medals", "page", $medal);
});

$router->get('/badges', function () {
    DrawViewWithTemplate("badges", "page");
});
$router->get('/badges/{badge}/', function ($badge) {
    DrawViewWithTemplate("badges", "page", $badge);
});

$router->get('/profiles', function () {
    DrawViewWithTemplate("profiles_home", "page");
});
$router->get('/profiles/{user}/', function ($user) {
    DrawViewWithTemplate("profiles", "page", $user);
});

$router->get('/rankings', function () {
    DrawViewWithTemplate("rankings_home", "page");
});
$router->get('/rankings/{badge}/', function ($badge) {
    DrawViewWithTemplate("rankings", "page", $badge);
});

$router->get('/x', function () {
    DrawViewWithTemplate("preview", "page");
});
$router->get('/test/', function () {
    DrawViewWithTemplate("test", "page");
});

$router->get('/login', function () {
    Site::$login_redir_here = false;
    General::Redirect("https://osu.ppy.sh/oauth/authorize?response_type=code&redirect_uri=" . htmlentities(REDIRECT_URI) . "&client_id=" . CLIENT_ID);
    //General::Redirect("https://osu.ppy.sh/oauth/authorize?client_id=" . CLIENT_ID . "&redirect_uri=" . REDIRECT_URI . "&response_type=code");
});
$router->get('/oauth', function () {
    Site::$login_redir_here = false;
    Oauth\Login::FrontendLogin();
});
$router->get('/logout', function () {
    Site::$login_redir_here = false;
    \Database\Session::Logout();
    General::Redirect("/");
});

$router->get('/snapshots', function () {

});
$router->get('/snapshots/all', function () {
    if(!\Data\OsekaiUsers::HasPermission("snapshots.admin")) exit;
    DrawViewWithTemplate("snapshots_admin", "page");
});
$router->get('/snapshots/upload', function () {
    if(!\Data\OsekaiUsers::HasPermission("snapshots.admin.upload")) exit;
    DrawViewWithTemplate("snapshots_admin_upload", "page");
});
$router->get('/snapshots/edit/{ver}', function ($ver) {
    if(!\Data\OsekaiUsers::HasPermission("snapshots.admin.edit")) exit;
    DrawViewWithTemplate("snapshots_admin_ver", "page", $ver);
});


$router->get('/poll/1', function () {
    DrawViewWithTemplate("poll_1_hardware", "page");
});
$router->post('/poll/1', function () {
    echo \Polldata\P1_Hardware::Submit()->ReturnJson();
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
        "Creator" => Session::UserData()['id'],
    ];
    print_r($_FILES);

    Connection::insert("UserFeedback_Bug", $item);
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
    IO::Send("/feedback/feedback", $item);
});