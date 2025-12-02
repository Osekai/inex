<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RankingMedalData extends AbstractMigration
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
        $table = $this->table('Rankings_Users_Medals', ['id' => false, 'primary_key' => ['User_ID', 'Medal_ID']]);
        $table
            ->addColumn('User_ID', 'integer', ["precision" => 11, 'null' => false])
            ->addColumn('Medal_ID', 'integer', ["precision" => 4, 'null' => false])
            ->addColumn('Achieved_At', 'datetime')
            ->create();
    }
}
