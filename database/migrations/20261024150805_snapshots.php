<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Snapshots extends AbstractMigration
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
        $this->table('Snapshots_Versions', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('Version', 'string', ['null' => false, 'limit' => 64])
            ->addColumn('Release_Date', 'date', ['null' => true])
            ->addColumn('Group_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Flag_Auto_Updates', 'integer', ['null' => false, 'limit' => 1, 'default' => 0])
            ->addColumn('Flag_Requires_Server', 'integer', ['null' => false, 'limit' => 1, 'default' => 0])
            ->addColumn('Meta_Name', 'string', ['null' => true, 'limit' => 128])
            ->addColumn('Meta_Archival_Date', 'datetime', ['null' => true])
            ->addColumn('Meta_Archiver_ID', 'integer', ['null' => true, 'signed' => false])
            ->addColumn('Meta_Description', 'text', ['null' => true])
            ->addColumn('Meta_Extra_Info', 'text', ['null' => true])
            ->addColumn('Meta_Video', 'string', ['null' => true, 'limit' => 64])
            ->addColumn('Analytics_Views', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('Analytics_Downloads', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addIndex('Version', ['unique' => true])
            ->addIndex('Group_ID')
            ->addIndex('Release_Date')
            ->addIndex('Meta_Archiver_ID')
            ->create();

        $this->table('Snapshots_Groups', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('Group_Name', 'string', ['null' => false, 'limit' => 64])
            ->addColumn('Order', 'integer', ['null' => false, 'default' => 0])
            ->create();

        $this->table('Snapshots_Versions_Screenshots', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('Version_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Width', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Height', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Game_Screen', 'string', ['null' => true, 'limit' => 64])
            ->addColumn('Order', 'integer', ['null' => false, 'default' => 0])
            ->addIndex(['Version_ID', 'Order'])
            ->create();

        $this->table('Snapshots_Versions_Download_Mirrors', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('Version_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Name', 'string', ['null' => false, 'limit' => 128])
            ->addColumn('URL', 'string', ['null' => false, 'limit' => 512])
            ->addIndex('Version_ID')
            ->create();

        $this->table('Snapshots_Submissions', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('User_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Title', 'string', ['null' => false, 'limit' => 255])
            ->addColumn('Description', 'text', ['null' => true])
            ->addColumn('Link', 'string', ['null' => false, 'limit' => 512])
            ->addColumn('Date', 'datetime', ['null' => false, 'default' => 'CURRENT_TIMESTAMP'])
            // 0 pending, 1 accepted, 2 denied
            ->addColumn('Status', 'integer', ['null' => false, 'limit' => 1, 'default' => 0])
            ->addIndex('User_ID')
            ->addIndex('Status')
            ->addIndex('Date')
            ->create();
    }
}
