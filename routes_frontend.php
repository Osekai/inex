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



$router->get('/home', function () {
    DrawViewWithTemplate("home", "page");
});


$router->get('/medals', function () {
    DrawViewWithTemplate("medals", "page");
});
$router->get('/medals/{medal}/', function ($medal) {
    DrawViewWithTemplate("medals", "page", $medal);
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
