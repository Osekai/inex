<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SnapshotsFiles extends AbstractMigration
{
    public function change(): void
    {
        $this->table('Snapshots_Versions')
            // null means there's no file uploaded yet
            ->addColumn('File_Format', 'string', ['null' => true, 'limit' => 16, 'after' => 'Flag_Requires_Server'])
            ->addColumn('File_Size', 'biginteger', ['null' => true, 'signed' => false, 'after' => 'File_Format'])
            ->addColumn('Published', 'integer', ['null' => false, 'limit' => 1, 'default' => 0, 'after' => 'File_Size'])
            ->addIndex('Published')
            ->update();
    }
}
