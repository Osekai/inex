<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Badges extends AbstractMigration
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
        $table = $this->table('Badges_Data', ['id' => false, 'primary_key' => ['ID', 'Name']]);
        $table
            ->addColumn('ID', 'integer', ["precision" => 8, 'null' => false])
            ->addColumn('Name', 'string', ['precision' => 100, 'null' => false])
            ->addColumn('Image_URL', 'string', ['precision' => 100, 'null' => false])
            ->create();


        $table = $this->table('Badges_Users', ['id' => false, 'primary_key' => ['Badge_ID', 'User_ID']]);
        $table
            ->addColumn('Badge_ID', 'integer', ["precision" => 8, 'null' => false])
            ->addColumn('User_ID', 'integer', ["precision" => 11, 'null' => false])
            ->addColumn('Description', 'string', ['precision' => 2000])
            ->addColumn('Date_Awarded', 'datetime')
            ->create();
    }
}
