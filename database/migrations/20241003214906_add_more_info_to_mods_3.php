<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddMoreInfoToMods3 extends AbstractMigration
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
        $table = $this->table('Common_Mods');

        $table->changeColumn('ID', 'string', ['limit' => 4, 'null' => false])
            ->addIndex(['ID', 'Name', 'Gamemode'], ['unique' => true]) // Add new composite primary key
            ->update();
    }
}
