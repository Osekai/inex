<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Medals extends AbstractMigration
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
        $table = $this->table('Medals_Beatmaps', ['id' => false, 'primary_key' => ['ID']]);
        $table
            ->addColumn('ID', 'integer', ["precision" => 8])
            ->addColumn('Medal_ID', 'integer', ["precision" => 4])
            ->addColumn('Beatmap_ID', 'integer', ["precision" => 11])
            ->addColumn('Beatmap_Submitted_User_ID', 'integer', ['precision' => 11])
            ->addColumn('Beatmap_Submitted_Date', 'datetime')
            ->addColumn('Note', 'string', ['precision' => 2000])
            ->addColumn('Note_Submitted_User_ID', 'integer', ['precision' => 11])
            ->addColumn('Note_Submitted_Date', 'datetime')
            ->create();

        $table = $this->table('Medals_Configuration', ['id' => false, 'primary_key' => ['Medal_ID']]);
        $table
            ->addColumn('Medal_ID', 'integer', ["precision" => 4])
            ->addColumn('Video_URL', 'string', ['precision' => 200])
            ->addColumn('First_Achieved_Date', 'datetime')
            ->addColumn('First_Achieved_User_ID', 'integer', ["precision" => 11])
            ->addColumn('Is_Solution_Found', 'integer', ["precision" => 1])
            ->addColumn('Is_Lazer', 'integer', ["precision" => 1])
            ->addColumn('Is_Restricted', 'integer', ["precision" => 1])
            ->addColumn('Solution', 'string', ['precision' => 2000])
            ->addColumn('Date_Released', 'datetime')
            ->create();

        $table = $this->table('Medals_Data', ['id' => false, 'primary_key' => ['Medal_ID']]);
        $table
            ->addColumn('Medal_ID', 'integer', ["precision" => 4])
            ->addColumn('Name', 'string', ['precision' => 50])
            ->addColumn('Link', 'string', ['precision' => 70])
            ->addColumn('Description', 'string', ['precision' => 500])
            ->addColumn('Gamemode', 'string', ['precision' => 8])
            ->addColumn('Grouping', 'string', ['precision' => 30])
            ->addColumn('Instructions', 'string', ['precision' => 500])
            ->addColumn('Ordering', 'integer', ["precision" => 2])
            ->addColumn('Frequency', 'float')
            ->addColumn('Count_Achieved_By', 'integer', ["precision" => 10])
            ->create();

        $table = $this->table('Medals_Favourites', ['id' => false, 'primary_key' => ['Medal_ID', "User_ID"]]);
        $table
            ->addColumn('User_ID', 'integer', ["precision" => 11])
            ->addColumn('Medal_ID', 'integer', ["precision" => 4])
            ->create();

        $table = $this->table('Medals_Solutions_Mods', ['id' => false, 'primary_key' => ['Medal_ID', "Mod"]]);
        $table
            ->addColumn('Medal_ID', 'integer', ["precision" => 11])
            ->addColumn('Mod', 'string', ["precision" => 4])
            ->create();
    }
}
