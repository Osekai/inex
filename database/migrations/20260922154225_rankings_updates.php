<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RankingsUpdates extends AbstractMigration
{
    public function change(): void
    {
        $this->table('Rankings_Updates', [
            'id' => false,
            'primary_key' => ['ID'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('ID', 'biginteger', [
                'signed' => false,
                'identity' => true,
            ])
            ->addColumn('User_ID', 'integer', [
                'null' => false,
            ])
            ->addColumn('Checked_At', 'datetime', [
                'null' => false,
            ])
            // did anything actually move since last check
            ->addColumn('Changed', 'boolean', [
                'null' => false,
            ])
            ->addColumn('Duration_MS', 'smallinteger', [
                'signed' => false,
                'null' => true,
            ])
            // heap rebuild reads latest row per user
            ->addIndex(['User_ID', 'Checked_At'], ['name' => 'idx_user_checked'])
            // ranged delete for the purge
            ->addIndex(['Checked_At'], ['name' => 'idx_checked_at'])
            ->create();
    }
}