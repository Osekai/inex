<?php
const ROOT = __DIR__;
include("./php/Debug/Timings.php");
ini_set('display_errors', 0); // just read the terminal silly

$time = microtime();
$time = explode(' ', $time);
$time = $time[1] + $time[0];
$start = $time;

$s = new \Debug\Timings("postdata");
if (isset($_SERVER['CONTENT_TYPE']) && $_SERVER['CONTENT_TYPE'] === 'application/json') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() === JSON_ERROR_NONE) {
        $_POST = array_merge($_POST, $data);
        $_REQUEST = array_merge($_REQUEST, $_POST);
    }
}
$s->finish();



$s = new \Debug\Timings("autoload");
include("autoload.php");
$s->finish();
$s = new \Debug\Timings("vendor autoload");
require __DIR__ . '/vendor/autoload.php';
$s->finish();


if(php_sapi_name() == "cli") {
    if($argv[1] == "task") {
        include("php/Tasks/run.php");
    } else {
        echo "Use command 'task' to run tasks\n";
    }
    exit;
} else {
    $s = new \Debug\Timings("ob_start");
    ob_start();
    $s->finish();
}

$s = new \Debug\Timings("init");
$router = new \Bramus\Router\Router();
include("error.php");
$s->finish();

$s = new \Debug\Timings("config");
include("config.php");
$s->finish();

$s = new \Debug\Timings("general");
include("php/General.php");
$s->finish();

$s = new \Debug\Timings("session");
Database\Session::Begin();
$s->finish();

$s = new \Debug\Timings("site");
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
$s->finish();

$output = ob_get_contents();
ob_end_clean();

if(Site::$am_frontend) {
    $localization = new Localization();
    $output = $localization->ParseHTML($output);
}


$time = microtime();
$time = explode(' ', $time);
$time = $time[1] + $time[0];
$finish = $time;
$total_time = round(($finish - $start), 4);


$output = str_replace("{TIME}", $total_time * 1000 . " ms", $output);


echo $output;
if(Site::$am_frontend) {
    ?>
    <script id="debug-timings">
        if(typeof(window.be) == "undefined") window.be = {};
        window.be.debugTimings = {
            "start": <?= $start ?>,
            "finish": <?= microtime(true) ?>,
            "timings": <?= json_encode(\Debug\Timings::$finished) ?>
        }
    </script>
    <?php
}
?>

