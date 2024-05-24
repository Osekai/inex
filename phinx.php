<?php
include("config.php");
return
[
    'paths' => [
        'migrations' => './database/migrations',
        'seeds' => './database/seeds'
    ],
    'environments' => [
        'default_migration_table' => 'phinxlog',
        'default_environment' => 'development',
        'production' => [
            'adapter' => 'mysql',
            'host' => DATABASE_HOSTNAME,
            'name' => DATABASE_NAME,
            'user' => DATABASE_USERNAME,
            'pass' => DATABASE_PASSWORD,
            'port' => '3306',
            'charset' => 'utf8',
        ]
    ],
    'version_order' => 'creation'
];
