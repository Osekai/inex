<?php

namespace eti;

use Database\BaseConnection;
use Database\Connection;
use Phinx\Config\Config;
use Phinx\Db\Adapter\AdapterFactory;

$configArray = include 'phinx.php'; // Adjust the path as necessary
$config = new Config($configArray);

$adapterFactory = new AdapterFactory();
$adapter = $adapterFactory->getAdapter($config->getEnvironment('production')['adapter'], []);
$adapter->setOptions($config->getEnvironment('production'));

$runners = [];



$eclipse = new BaseConnection(ETI_DATABASE_HOSTNAME, ETI_DATABASE_USERNAME, ETI_DATABASE_PASSWORD, ETI_DATABASE_NAME);

function AddRunner($name, $runner)
{
    global $runners;
    $runners[] = ["name" => $name, "class" => $runner];
}

AddRunner("beatmaps", new runners\Beatmaps());
AddRunner("comments", new runners\Comments());
AddRunner("votes", new runners\Votes());


if (count($argv) < 3) {
    echo "Available runners:\n";
    foreach ($runners as $runner) {
        echo " - " . $runner['name'] . "\n";
    }
    echo "Use 'all' to run all\n";
    exit;
} else {
    foreach ($runners as $runner) {
        $run = false;
        if ($argv[2] == "all") $run = true; else $run = $argv[2] == $runner['name'];

        if ($run) {
            echo "Running " . $runner['name'] . "\n";
            $args = array_slice($argv, 3);

            $runner['class']->setAdapter($adapter);
            $runner['class']->eclipse_db = $eclipse;
            $runner['class']->etirun($args);
        }
    }
}