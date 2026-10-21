<?php
// ported from anthera: database/migrations/20250827143200_tasks.php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Tasks extends AbstractMigration
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
        $table = $this->table('Site_Tasks');

        $table->addColumn('TaskName', 'string', ['limit' => 255, 'comment' => 'The PHP task class name'])
            ->addColumn('Frequency', 'integer', [
                'comment' => 'Run interval in seconds',
                'default' => 0
            ])
            ->addColumn('LastRan', 'datetime', [
                'null' => true,
                'comment' => 'Last time this task was executed'
            ])
            ->addColumn('Status', 'string', [
                'limit' => 50,
                'default' => 'pending',
                'comment' => 'Optional: last run status like pending, success, failed'
            ])
            ->addIndex(['TaskName'], ['unique' => true])
            ->create();
    }
}
