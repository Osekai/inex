<?php

namespace Tasks;

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

AddRunner("eti_beatmaps", new Runners\Beatmaps());
AddRunner("eti_comments", new Runners\Comments());
AddRunner("eti_votes", new Runners\Votes());

AddRunner("medalimages", new Runners\MedalImages());


if (count($argv) < 3) {
    echo "Available Runners:\n";
    foreach ($runners as $runner) {
        echo " - " . $runner['name'] . "\n";
    }
    exit;
} else {
    foreach ($runners as $runner) {
        $run = false;
        $run = $argv[2] == $runner['name'];

        if ($run) {
            echo "Running " . $runner['name'] . "\n";
            $args = array_slice($argv, 3);

            $runner['class']->setAdapter($adapter);
            $runner['class']->eclipse_db = $eclipse;
            $runner['class']->etirun($args);
        }
    }
}