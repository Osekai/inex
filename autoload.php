<?php
spl_autoload_register(function ($class) {
    $classPath = str_replace('\\', DIRECTORY_SEPARATOR, $class) . '.php';
    $filePath = __DIR__ . '/php/' . $classPath;


    if (file_exists($filePath)) {
        include_once $filePath;
    } else {
        error_log("Could not find " . $filePath);
        //print_r($filePath);
        //echo ":(";
        
    }
});