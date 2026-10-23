<?php

// Load .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Function to safely get environment variable
function env($key, $default = null) {
    $val = isset($_ENV[$key]) ? $_ENV[$key] : $default;
    if($val == "true") return true;
    if($val == "false") return false;
    if(is_numeric($val)) return (int)$val;
    return $val;
}

// Basic Data
define("INSTANCE", env('INSTANCE', 'osekai-inex'));
define("DEV", env('DEV', false));

// URL
// fwd forwards (https://<id>-tza-fwd.untone.in) get their url from the host header
$fwdHost = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? "";
if (preg_match('/^[a-z0-9-]+-tza-fwd\.untone\.in$/', $fwdHost)) {
    define("URL", "https://" . $fwdHost);
} else {
    define("URL", env('URL'));
}

// OAUTH Login
define("CLIENT_ID", env('CLIENT_ID'));
define("CLIENT_SECRET", env('CLIENT_SECRET'));
define("REDIRECT_URI", URL . "/oauth");

// Database Connection
define("DATABASE_NAME", env('DATABASE_NAME'));
define("DATABASE_USERNAME", env('DATABASE_USERNAME'));
define("DATABASE_PASSWORD", env('DATABASE_PASSWORD'));
define("DATABASE_HOSTNAME", env('DATABASE_HOSTNAME'));

define("ETI_DATABASE_NAME", env('ETI_DATABASE_NAME'));
define("ETI_DATABASE_USERNAME", env('ETI_DATABASE_USERNAME'));
define("ETI_DATABASE_PASSWORD", env('ETI_DATABASE_PASSWORD'));
define("ETI_DATABASE_HOSTNAME", env('ETI_DATABASE_HOSTNAME'));

define("USE_MEMCACHE", filter_var(env('USE_MEMCACHE'), FILTER_VALIDATE_BOOLEAN));
define("GITHUB_API_KEY", env('GITHUB_API_KEY'));

// Moderation Webhooks
define("MOD_WEBHOOK_EDITS", env('MOD_WEBHOOK_EDITS'));
define("MOD_WEBHOOK", env('MOD_WEBHOOK'));

// S3 connection
define("BUCKET_NAME", env('BUCKET_NAME'));
define("CLOUDFLARE_TOKEN", env('CLOUDFLARE_TOKEN'));
define("BUCKET_ENDPOINT", env('BUCKET_ENDPOINT'));
define("ACCESS_KEY_ID", env('ACCESS_KEY_ID'));
define("ACCESS_KEY_SECRET", env('ACCESS_KEY_SECRET'));
define("S3_URL_PATH", env('S3_URL_PATH'));

define("USE_AMPRA", filter_var(env('USE_AMPRA'), FILTER_VALIDATE_BOOLEAN));

define("SCRIPTS_API_URL", env('SCRIPTS_API_URL'));
define("SCRIPTS26_ADDRESS", env('SCRIPTS26_ADDRESS'));
define("SCRIPTS26_PASSWORD", env('SCRIPTS26_PASSWORD'));

define("FEATURE_FLAGS", [
    "profiles" => env('FEATUREFLAG_PROFILES', false)
]);

define("USING_NEW_CONFIG", true);
?>
