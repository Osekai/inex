<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Beatmaps extends AbstractMigration
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
        $table = $this->table('Beatmaps_Data', ['id' => false, 'primary_key' => ['Beatmap_ID']]);
        $table
            ->addColumn('Beatmap_ID', 'integer', ["precision" => 10, 'null' => false])
            ->addColumn('Beatmapset_ID', 'integer', ["precision" => 10, 'null' => false])
            ->addColumn('Mapper_ID', 'integer', ["precision" => 11, 'null' => false])
            ->addColumn('Gamemode', 'string', ['precision' => 5])
            ->addColumn('Song_Title', 'string', ['precision' => 80, 'null' => false])
            ->addColumn('Song_Artist', 'string', ['precision' => 80, 'null' => false])
            ->addColumn('Mapper_Name', 'string', ['precision' => 27])
            ->addColumn('Difficulty_Rating', 'double')
            ->addColumn('Difficulty_Name', 'string', ['precision' => 80])
            ->addColumn('Download_Unavailable', 'integer', ['precision' => 1])
            ->create();

        $table = $this->table('Beatmaps_Packs', ['id' => false, 'primary_key' => ['Beatmapset_ID', "Pack_ID"]]);
        $table
            ->addColumn('Beatmapset_ID', 'integer', ["precision" => 10, 'null' => false])
            ->addColumn('Pack_ID', 'string', ["precision" => 10, 'null' => false])
            ->create();
    }
}
