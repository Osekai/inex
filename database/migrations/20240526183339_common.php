<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Common extends AbstractMigration
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
        $table = $this->table('Common_Comments', ['id' => false, 'primary_key' => ['ID']]);
        $table
            ->addColumn('ID', 'integer', ["precision" => 8, 'null' => false])
            ->addColumn('Target_ID', 'integer', ["precision" => 11])
            ->addColumn('Target_Table', 'string', ['precision' => 40])
            ->addColumn('User_ID', 'integer', ["precision" => 11])
            ->addColumn('Parent_Comment_ID', 'integer', ["precision" => 8])
            ->addColumn('Text', 'text')
            ->addColumn('Date', 'datetime')
            ->addColumn('Is_Pinned', 'integer', ["precision" => 1])
            ->create();

        $table = $this->table('Common_Countries', ['id' => false, 'primary_key' => ['Country_Code']]);
        $table
            ->addColumn('Country_Code', 'string', ["precision" => 11, 'null' => false])
            ->addColumn('Name', 'string', ["precision" => 100, 'null' => false])
            ->create();

        $table = $this->table('Common_Mods', ['id' => false, 'primary_key' => ['Name', 'ID']]);
        $table
            ->addColumn('ID', 'string', ["precision" => 2, 'null' => false])
            ->addColumn('Name', 'string', ["precision" => 50, 'null' => false])
            ->create();

        $table = $this->table('Common_Votes', ['id' => false, 'primary_key' => ['Target_ID', 'Target_Table', 'User_ID']]);
        $table
            ->addColumn('Target_ID', 'integer', ["precision" => 11, 'null' => false])
            ->addColumn('Target_Table', 'string', ["precision" => 50, 'null' => false])
            ->addColumn('User_ID', 'integer', ["precision" => 11, 'null' => false])
            ->create();
    }
}
