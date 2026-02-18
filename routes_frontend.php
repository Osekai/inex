<?php
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

$router->get('/rankings', function () {
    DrawViewWithTemplate("rankings", "page");
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
    General::Redirect("https://osu.ppy.sh/oauth/authorize?response_type=code&redirect_uri=" . htmlentities(REDIRECT_URI) . "&client_id=" . CLIENT_ID);
    //General::Redirect("https://osu.ppy.sh/oauth/authorize?client_id=" . CLIENT_ID . "&redirect_uri=" . REDIRECT_URI . "&response_type=code");
});
$router->get('/oauth', function () {
    Oauth\Login::FrontendLogin();
});
$router->get('/logout', function () {
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
