<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class BeatmapPacks extends AbstractMigration
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
        $table = $this->table('Medals_Solutions_Beatmaps_Packs', ['id' => false, 'primary_key' => ['Medal_ID', "Pack_ID", 'Gamemode']]);
        $table
            ->addColumn('Medal_ID', 'integer', ["precision" => 11, 'null' => false])
            ->addColumn('Pack_ID', 'string', ["precision" => 8, 'null' => false])
            ->addColumn('Gamemode', 'string', ["precision" => 5, 'null' => false])
            ->addColumn('Maps_Count', 'integer', ["precision" => 6])
            ->addColumn('Maps_Length', 'integer', ["precision" => 6])
            ->addColumn('Name', 'string', ["precision" => 200, 'null' => false])
            ->addColumn('Link', 'string', ["precision" => 400, 'null' => false])
            ->create();
    }
}
