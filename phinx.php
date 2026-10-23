<?php
include("config.php");
include("autoload.php");
require __DIR__ . '/vendor/autoload.php';

return
[
    'paths' => [
        'migrations' => './database/migrations',
        'seeds' => './database/seeds'
    ],
    'environments' => [
        'default_migration_table' => 'System_Phinx',
        'default_environment' => 'production',
        'production' => [
            'adapter' => 'mysql',
            'host' => DATABASE_HOSTNAME,
            'name' => DATABASE_NAME,
            'user' => DATABASE_USERNAME,
            'pass' => DATABASE_PASSWORD,
            'port' => '3306',
            'charset' => 'utf8mb4',
        ]
    ],
    'version_order' => 'creation'
];
