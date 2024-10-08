<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Roles extends AbstractMigration
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
        $table = $this->table('System_Roles_Roles', ['id' => false, 'primary_key' => ['ID']]);
        $table
            ->addColumn('ID', 'integer', ["precision" => 4, 'null' => false, 'identity' => true])
            ->addColumn('Name_Short', 'string', ['precision' => 100])
            ->addColumn('Name_Long', 'string', ['precision' => 200])
            ->addColumn('Colour', 'string', ['precision' => 500])
            ->addColumn('Permissions', 'json')
            ->addColumn('Blocked_Permissions', 'json')
            ->create();

        $table = $this->table('System_Roles_Assignments', ['id' => false, 'primary_key' => ['User_ID', 'Role_ID']]);
        $table
            ->addColumn('User_ID', 'integer', ["precision" => 11, 'null' => false])
            ->addColumn('Role_ID', 'integer', ["precision" => 4, 'null' => false])
            ->create();
    }
}
