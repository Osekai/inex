<?php
register_shutdown_function( "fatal_handler" );

function fatal_handler() {
    $errfile = "unknown file";
    $errstr  = "shutdown";
    $errno   = E_CORE_ERROR;
    $errline = 0;

    $error = error_get_last();

    if($error !== NULL && $errno === E_ERROR) {
        $errno   = $error["type"];
        $errfile = $error["file"];
        $errline = $error["line"];
        $errstr  = $error["message"];

        $errfile = str_replace("/var/www/anthera/data/www/anthera.art", "", $errfile);

        echo "<br><br><br><center><p>There was a fatal error rendering this page</p>";
        echo "<small>" . $errfile . ":" . $errline . " (" . $errstr . ")</small></center>";
    }
}