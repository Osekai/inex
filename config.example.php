<?php
// Basic Data
const DEV = true;
// fwd forwards (https://<id>-tza-fwd.untone.in) get their url from the host header
$fwdHost = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? "";
if (preg_match('/^[a-z0-9-]+-tza-fwd\.untone\.in$/', $fwdHost)) {
    define("URL", "https://" . $fwdHost);
} else {
    define("URL", "http://0.0.0.0:19242");
}

// OAUTH Login
const CLIENT_ID = "31799";
const CLIENT_SECRET = "ilolnoG5ltKbwe";
const REDIRECT_URI = URL . "/oauth";

// Database Connection
const DATABASE_NAME = "anthera";
const DATABASE_USERNAME = "root";
const DATABASE_PASSWORD = "password";
const DATABASE_HOSTNAME = "127.0.0.1";

const ETI_DATABASE_NAME = "osekai";
const ETI_DATABASE_USERNAME = "root";
const ETI_DATABASE_PASSWORD = "password";
const ETI_DATABASE_HOSTNAME = "localhost";

// Caching
const USE_MEMCACHE = false;
const GITHUB_API_KEY = "";


const MOD_WEBHOOK_EDITS = null;
const MOD_WEBHOOK = null;


const BUCKET_NAME = "";
const CLOUDFLARE_TOKEN = "";
const BUCKET_ENDPOINT = "";
const ACCESS_KEY_ID = "";
const ACCESS_KEY_SECRET = "";
const S3_URL_PATH = "";


const USE_AMPRA = false;

const SCRIPTS_API_URL = "http://127.0.0.1:3000/";
// where inex talks to scripts26 server side, host:port
const SCRIPTS26_ADDRESS = "127.0.0.1:3000";
// scripts26's ADMIN_PASSWORD
const SCRIPTS26_PASSWORD = "";
