<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SnapshotsFeatured extends AbstractMigration
{
    public function change(): void
    {
        $this->table('Snapshots_Featured', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('Version_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Description', 'text', ['null' => false])
            ->addColumn('End_Date', 'datetime', ['null' => false])
            ->addColumn('Created_By', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Created_At', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
            ->addIndex('Version_ID')
            ->addIndex('End_Date')
            ->create();
    }
}
