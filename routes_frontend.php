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
$router->get('/medals/([^/]+)/', function ($medal) {
    DrawViewWithTemplate("medals", "page", $medal);
});

$router->get('/badges', function () {
    DrawViewWithTemplate("badges", "page");
});
$router->get('/badges/([^/]+)/', function ($badge) {
    DrawViewWithTemplate("badges", "page", $badge);
});

$router->get('/profiles', function () {
    DrawViewWithTemplate("profiles_home", "page");
});
$router->get('/profiles/banner/preview/([^/]+)', function ($key) {
    $result = Banners::RenderPreview($key);
    // errors come back as plain strings
    echo is_array($result) ? $result['html'] : $result;
});
$router->get('/profiles/banner/([^/]+)/html', function ($id) {
    $result = Banners::RenderBanner($id, $_GET['userCheck'] ?? null);
    if($result->success === false) {
        header("HTTP/1.1 404 Not Found");
        $notFound = Banners::RenderNotFound();
        echo is_array($notFound) ? $notFound['html'] : $notFound;
        exit;
    } else {
        echo $result['html'];
    }
});
$router->get('/profiles/me', function () {
    if (!\Database\Session::LoggedIn()) {
        General::Redirect("/login");
    }
    General::Redirect("/profiles/" . \Database\Session::UserData()['id']);
});
$router->get('/profiles/([^/]+)/([^/]+)', function ($user, $gamemode) {
    DrawViewWithTemplate("profiles", "page", $user, $gamemode);
});
$router->get('/profiles/([^/]+)/', function ($user) {
    DrawViewWithTemplate("profiles", "page", $user, "");
});


$router->get('/rankings', function () {
    DrawViewWithTemplate("rankings_home", "page");
});
$router->get('/rankings/([^/]+)/', function ($badge) {
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
    DrawViewWithTemplate("snapshots", "page");
});
$router->get('/snapshots/([0-9]+)', function ($id) {
    DrawViewWithTemplate("snapshots", "page", $id);
});
$router->get('/snapshots/admin', function () {
    if (!\Data\OsekaiUsers::HasPermission("snapshots.admin")) exit;
    DrawViewWithTemplate("snapshots_admin", "page");
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


$router->get('/legal/licences', function () {
    DrawViewWithTemplate("licences", "page");
});


$router->get('/guidelines', function () {
    DrawViewWithTemplate("communityguidelines", "page");
});


$router->get('/omh/retro_achiever', function () {
    DrawViewWithTemplate("retro_achiever", "none");
});


$router->get('/sitemap.xml', function () {
    // ported from anthera: routing/frontend.php
    header('Content-Type: application/xml; charset=utf-8');
    $cache = \Database\Memcache::get("sitemap");
    if ($cache !== false && $cache !== "") {
        echo $cache;
        exit;
    }

    function addUrl($loc, $lastmod = null, $priority = '0.5', $changefreq = 'daily')
    {
        $loc = URL . $loc;

        $url = '<url>';
        $url .= '<loc>' . htmlspecialchars($loc, ENT_QUOTES | ENT_XML1) . '</loc>';
        if ($lastmod) {
            $url .= '<lastmod>' . date('Y-m-d', strtotime($lastmod)) . '</lastmod>';
        }
        $url .= '<changefreq>' . htmlspecialchars($changefreq, ENT_QUOTES | ENT_XML1) . '</changefreq>';
        $url .= '<priority>' . htmlspecialchars($priority, ENT_QUOTES | ENT_XML1) . '</priority>';
        $url .= '</url>';
        return $url;
    }

    $output = '<?xml version="1.0" encoding="UTF-8"?>';
    $output .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    $output .= addUrl('/', null, '1.0', 'daily');

    $output .= addUrl('/medals', null, '0.9', 'daily');
    $output .= addUrl('/badges', null, '0.9', 'daily');
    $output .= addUrl('/rankings', null, '0.9', 'daily');
    $output .= addUrl('/profiles', null, '0.8', 'daily');

    $output .= addUrl('/omh/retro_achiever', null, '0.4', 'monthly');
    $output .= addUrl('/guidelines', null, '0.3', 'yearly');
    $output .= addUrl('/legal/licences', null, '0.2', 'yearly');
    $output .= addUrl('/legal/privacy', null, '0.2', 'yearly');
    $output .= addUrl('/legal/contact', null, '0.2', 'yearly');

    $medals = \Data\Medals::GetAll()->content;
    foreach ($medals as $medal) {
        $output .= addUrl('/medals/' . rawurlencode($medal['Name']), null, '0.8', 'weekly');
    }

    $badges = \Data\Badges::GetAll()->content;
    foreach ($badges as $badge) {
        $output .= addUrl('/badges/' . rawurlencode($badge['Name']), null, '0.1', 'weekly');
    }

    // keep in sync with types in frontend/src/js/views/rankings/RankingsUtils.js
    $rankings = ["medals_users", "medals_rarity", "pp", "level", "accuracy", "replays", "mapsets", "subscribers", "badges", "playtime"];
    foreach ($rankings as $ranking) {
        $output .= addUrl('/rankings/' . $ranking, null, '0.7', 'daily');
    }

    $output .= '</urlset>';

    echo $output;
    \Database\Memcache::set("sitemap", $output, 86400);
});


$router->get('/scoretest', function () {
    DrawViewWithTemplate("scoretester", "page");
});
