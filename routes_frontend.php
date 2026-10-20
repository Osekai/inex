<?php

use Data\Profiles\Banners;

if (!isset($router)) die("Do not call this directly!");

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
$router->get('/profiles/banner/{id}/html', function ($id) {
    $bannerData = Banners::GetBanner($id);
    if ($bannerData === null) return;
    Site::$profiles_banner = $bannerData;

    Banners::$themeParser = new \Data\Profiles\BannerThemeParser();
    foreach ($bannerData->content['Theme']['Settings'] as $key => &$value) {
        Banners::$themeParser->Parse($key, $value, $bannerData->content['Settings']);
    }
    unset($value);

    // we don't like the template rendering since it's old and doesn't let us do our fuckery so we do it ourselves

    $qu = $bannerData->content['User'];
    $elements = [
        "pb-pfp" => <<< HTML
 <img src="https://a.ppy.sh/{$qu['User']['id']}" class="pb-pfp">
HTML,
        "pb-gamemode-icon" => <<< HTML
<i class="icon-gamemode-{$qu['User']['playmode']}"></i>
HTML,
        "pb-medals-completion-bar" => <<< HTML
<div class="medals-completion-bar">
<div class="bar" style="width: {$qu["Statistics"]["Medals"]["Percentage"]}%"></div>
</div>
HTML
    ];


    ob_start();
    include "frontend/profiles-banners/" . $bannerData->content['Theme']['Key'] . "/" . $bannerData->content['Theme']['Key'] . ".php";
    $page = ob_get_contents();
    ob_end_clean();

    foreach ($elements as $key => $value) {
        $page = str_replace("<$key></$key>", $value, $page);
    }

    include "templates/profiles_banner.php";
});
$router->get('/profiles/{user}/{gamemode}', function ($user, $gamemode) {
    DrawViewWithTemplate("profiles", "page", $user, $gamemode);
});
$router->get('/profiles/{user}/', function ($user) {
    DrawViewWithTemplate("profiles", "page", $user, "");
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
    if (!\Data\OsekaiUsers::HasPermission("snapshots.admin")) exit;
    DrawViewWithTemplate("snapshots_admin", "page");
});
$router->get('/snapshots/upload', function () {
    if (!\Data\OsekaiUsers::HasPermission("snapshots.admin.upload")) exit;
    DrawViewWithTemplate("snapshots_admin_upload", "page");
});
$router->get('/snapshots/edit/{ver}', function ($ver) {
    if (!\Data\OsekaiUsers::HasPermission("snapshots.admin.edit")) exit;
    DrawViewWithTemplate("snapshots_admin_ver", "page", $ver);
});


$router->get('/poll/1', function () {
    DrawViewWithTemplate("poll_1_hardware", "page");
});
$router->post('/poll/1', function () {
    echo \Polldata\P1_Hardware::Submit()->ReturnJson();
});


$router->get('/legal/privacy', function () {
    DrawViewWithTemplate("privacy", "page");
});


$router->get('/legal/contact', function () {
    DrawViewWithTemplate("contact", "page");
});


$router->get('/guidelines', function () {
    DrawViewWithTemplate("communityguidelines", "page");
});


$router->get('/scoretest', function () {
    DrawViewWithTemplate("scoretester", "page");
});
