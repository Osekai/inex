<?php
ini_set('display_errors', 0); // just read the terminal silly

$time = microtime();
$time = explode(' ', $time);
$time = $time[1] + $time[0];
$start = $time;




include("autoload.php");
require __DIR__ . '/vendor/autoload.php';

if(php_sapi_name() == "cli") {
    if($argv[1] == "task") {
        include("php/Tasks/run.php");
    } else {
        echo "Use command 'task' to run tasks\n";
    }
    exit;
} else {
    ob_start();
}

$router = new \Bramus\Router\Router();
include("error.php");

include("config.php");
include("php/General.php");


Database\Session::Begin();
include("frontend_resp.php");
include("variables.php");

function requireLogin(): bool
{
    if (!Database\Session::LoggedIn()) {
        DrawViewWithTemplate("404", "page", "Please log in to view this page");
        return false;
    }
    return true;
}

// ! only include when needed
// AWS\S3::getInstance();

$pages = [];


$router->set404(function () {
    header('HTTP/1.1 404 Not Found');
    DrawViewWithTemplate("404", "page");
});
$router->get('/home', function () {
    header("Location: /");
});


include("routes_backend.php");
include("routes_frontend.php");

//echo "<pre>";
//print_r($router->afterRoutes["GET"]);
//echo "</pre>";
$router->run();
$output = ob_get_contents();
ob_end_clean();


$time = microtime();
$time = explode(' ', $time);
$time = $time[1] + $time[0];
$finish = $time;
$total_time = round(($finish - $start), 4);


$output = str_replace("{TIME}", $total_time * 1000 . " ms", $output);


echo $output;
?>

