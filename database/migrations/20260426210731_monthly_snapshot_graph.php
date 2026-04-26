<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class MonthlySnapshotGraph extends AbstractMigration
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
        $this->table('Rankings_Users_Monthly', ['id' => false, 'primary_key' => ['User_ID', 'Month']])
            ->addColumn('User_ID', 'integer', ['signed' => true])
            ->addColumn('Month', 'date')
            ->addColumn('Medal_Count', 'integer', ['signed' => false])
            ->create();
    }
}
