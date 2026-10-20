<?php

namespace Tasks;

use Database\BaseConnection;
use Phinx\Config\Config;
use Phinx\Db\Adapter\AdapterFactory;
use Phinx\Seed\AbstractSeed;

// eclipse -> inex migrations, gives them the eclipse db and phinx's table() for bulk inserts
class EclipseTask extends Task
{
    public BaseConnection $eclipse_db;

    private AbstractSeed $seed;

    public function _Run()
    {
        // set up here instead of the constructor, cron makes every task just to read its frequency
        $config = new Config(include ROOT . '/phinx.php');
        $environment = $config->getEnvironment('production');

        $adapter = (new AdapterFactory())->getAdapter($environment['adapter'], []);
        $adapter->setOptions($environment);

        $this->seed = new class extends AbstractSeed {};
        $this->seed->setAdapter($adapter);

        $this->eclipse_db = new BaseConnection(ETI_DATABASE_HOSTNAME, ETI_DATABASE_USERNAME, ETI_DATABASE_PASSWORD, ETI_DATABASE_NAME);

        parent::_Run();
    }

    public function table($tableName)
    {
        return $this->seed->table($tableName);
    }
}
