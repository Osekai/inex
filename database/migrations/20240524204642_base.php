<?php

declare(strict_types=1);

use Phinx\Db\Adapter\MysqlAdapter;
use Phinx\Migration\AbstractMigration;

final class Base extends AbstractMigration
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
        $table = $this->table('Sessions');
        $table->addColumn('Key', 'string', ["precision" => 64])
            ->addColumn('User_ID', 'integer')
            ->create();

        $table = $this->table('User_Settings');
        $table->addColumn('User_ID', 'integer')
            ->addColumn('Settings', 'text', ["limit" => MysqlAdapter::TEXT_LONG])
            ->create();

        $table = $this->table('Word_Blacklist');
        $table->addColumn('Settings', 'string', ["precision" => 64])
            ->create();
    }
}
