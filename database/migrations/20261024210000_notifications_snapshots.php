<?php

declare(strict_types=1);

use Phinx\Db\Adapter\MysqlAdapter;
use Phinx\Migration\AbstractMigration;

final class NotificationsSnapshots extends AbstractMigration
{
    public function change(): void
    {
        // same as Ref_Medals, points at Snapshots_Versions.ID
        $this->table('Notifications')
            ->addColumn('Ref_Snapshots', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'Ref_Medals',
            ])
            ->update();
    }
}
