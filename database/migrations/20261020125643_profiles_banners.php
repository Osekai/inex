<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ProfilesBanners extends AbstractMigration
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
        $this->table('Profiles_Banners', [
            "id" => "ID",
            "row_format" => "DYNAMIC"
        ])
            ->addColumn('User_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Created_At', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('Last_Updated', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addColumn('Settings', 'json', ['null' => true])
            ->addColumn('Theme_Key', 'string', ['null' => true, 'limit' => 128])
            ->addIndex('User_ID')
            ->create();

        $this->table('Profiles_Banners_Themes', [
            "id" => "ID",
            "row_format" => "DYNAMIC"
        ])
            ->addColumn('Key', 'string', ['null' => false, 'limit' => 128])
            ->addColumn('Name', 'string', ['null' => false, 'limit' => 128])
            ->addColumn('Resolution', 'string', ['null' => false, 'limit' => 128])
            ->addColumn('Category', 'string', ['null' => false, 'limit' => 128])
            ->addColumn('Settings', 'json', ['null' => true])
            ->addIndex('Name')
            ->addIndex('Key', ['unique' => true])
            ->create();
    }
}
