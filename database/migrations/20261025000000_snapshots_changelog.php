<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SnapshotsChangelog extends AbstractMigration
{
    public function change(): void
    {
        $this->table('Snapshots_Versions')
            ->addColumn('Meta_Changelog_Notes', 'text', ['null' => true, 'after' => 'Meta_Extra_Info'])
            ->addColumn('Meta_Changelog_Link', 'string', ['null' => true, 'limit' => 255, 'after' => 'Meta_Changelog_Notes'])
            ->update();
    }
}
