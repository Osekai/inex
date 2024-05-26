<?php

declare(strict_types=1);

use Phinx\Db\Adapter\MysqlAdapter;
use Phinx\Migration\AbstractMigration;

final class System extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        $table = $this->table('System_Sessions', ['id' => false, 'primary_key' => ['Key']]);
        $table->addColumn('Key', 'string', ['limit' => 64])
            ->addColumn('User_ID', 'integer')
            ->create();

        $table = $this->table('System_Users_Settings', ['id' => false, 'primary_key' => ['User_ID']]);
        $table->addColumn('User_ID', 'integer')
            ->addColumn('Settings', 'text', ['limit' => MysqlAdapter::TEXT_LONG])
            ->create();


        $table = $this->table('System_Users', ['id' => false, 'primary_key' => ['User_ID']]);
        $table->addColumn('User_ID', 'integer')
            ->addColumn('Name', 'string', ['precision' => 27])
            ->addColumn('Joined_Date', 'datetime')
            ->create();


        $table = $this->table('System_Blacklist_Words', ['id' => false, 'primary_key' => ['Word']]);
        $table->addColumn('Word', 'string', ['limit' => 64])
            ->create();
    }
}
