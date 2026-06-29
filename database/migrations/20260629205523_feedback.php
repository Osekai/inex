<?php

declare(strict_types=1);

use Phinx\Db\Adapter\MysqlAdapter;
use Phinx\Migration\AbstractMigration;

final class Feedback extends AbstractMigration
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
        $this->table('UserFeedback_Feedback', [
            "id" => "ID",
            "row_format" => "DYNAMIC"
        ])
            ->addColumn('Type', 'string', ['null' => false, 'limit' => 128])
            ->addColumn('Feedback', 'text', ['null' => false, 'limit' => MysqlAdapter::TEXT_LONG])
            ->addColumn('Rating', 'float', ['null' => true])
            ->addColumn('Priority', 'string', ['null' => false, 'limit' => 16, 'default' => 'low'])
            ->addColumn('Timestamp', 'string', ['null' => false, 'limit' => 64])
            ->addColumn('UserTimestamp', 'string', ['null' => true, 'limit' => 64])
            ->create();

        $this->table('UserFeedback_Bug', [
            "id" => "ID",
            "row_format" => "DYNAMIC"
        ])
            ->addColumn('Type', 'string', ['null' => false, 'limit' => 128])
            ->addColumn('Problem', 'text', ['null' => false, 'limit' => MysqlAdapter::TEXT_LONG])
            ->addColumn('Reproduce', 'text', ['null' => true, 'limit' => MysqlAdapter::TEXT_LONG])
            ->addColumn('Expected', 'text', ['null' => true, 'limit' => MysqlAdapter::TEXT_LONG])
            ->addColumn('Priority', 'string', ['null' => false, 'limit' => 16, 'default' => 'medium'])
            ->addColumn('UserAgent', 'string', ['null' => true, 'limit' => 512])
            ->addColumn('Url', 'string', ['null' => true, 'limit' => 512])
            ->addColumn('Referrer', 'string', ['null' => true, 'limit' => 512])
            ->addColumn('Viewport', 'string', ['null' => true, 'limit' => 32])
            ->addColumn('Screen', 'string', ['null' => true, 'limit' => 32])
            ->addColumn('DevicePixelRatio', 'float', ['null' => true])
            ->addColumn('ColorDepth', 'integer', ['null' => true])
            ->addColumn('Language', 'string', ['null' => true, 'limit' => 16])
            ->addColumn('Timezone', 'string', ['null' => true, 'limit' => 64])
            ->addColumn('Memory', 'float', ['null' => true])
            ->addColumn('Cores', 'integer', ['null' => true])
            ->addColumn('Online', 'boolean', ['null' => true])
            ->addColumn('Timestamp', 'string', ['null' => false, 'limit' => 64])
            ->addColumn('UserTimestamp', 'string', ['null' => true, 'limit' => 64])
            ->create();

        $this->table('UserFeedback_Bug')
            ->addColumn('TypeReadable', 'string', ['null' => true, 'limit' => 128, 'after' => 'Type'])
            ->update();

        $this->table('UserFeedback_Feedback')
            ->addColumn('TypeReadable', 'string', ['null' => true, 'limit' => 128, 'after' => 'Type'])
            ->update();

        $this->table('UserFeedback_Bug')
            ->addColumn('Secret', 'string', ['null' => true, 'limit' => 128, 'after' => 'Type'])
            ->update();

        $this->table('UserFeedback_Feedback')
            ->addColumn('Secret', 'string', ['null' => true, 'limit' => 128, 'after' => 'Type'])
            ->update();

        $this->table('UserFeedback_Bug')
            ->addColumn('Creator', 'biginteger')
            ->update();

        $this->table('UserFeedback_Feedback')
            ->addColumn('Creator', 'biginteger')
            ->update();
    }
}
