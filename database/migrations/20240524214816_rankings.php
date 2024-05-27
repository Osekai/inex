<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Rankings extends AbstractMigration
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
        $table = $this->table('Rankings_Users', ['id' => false, 'primary_key' => ['ID']]);
        $table
            ->addColumn('ID',                   'integer', ["precision" => 11])
            ->addColumn('Accuracy_Catch',       'decimal', ['precision' => 5, 'scale' => 2])
            ->addColumn('Accuracy_Mania',       'decimal', ['precision' => 5, 'scale' => 2])
            ->addColumn('Accuracy_Standard',    'decimal', ['precision' => 5, 'scale' => 2])
            ->addColumn('Accuracy_Stdev',       'decimal', ['precision' => 5, 'scale' => 2])
            ->addColumn('Accuracy_Taiko',       'decimal', ['precision' => 5, 'scale' => 2])
            ->addColumn('Count_Badges',         'integer', ["precision" => 4])
            ->addColumn('Count_Maps_Loved',     'integer', ["precision" => 4])
            ->addColumn('Count_Maps_Ranked',    'integer', ["precision" => 4])
            ->addColumn('Count_Medals',         'integer', ["precision" => 4])
            ->addColumn('Count_Replays_Watched','integer', ["precision" => 10])
            ->addColumn('Count_Subscribers',    'integer', ["precision" => 7])
            ->addColumn('Country_Code',         'string',  ["precision" => 3])
            ->addColumn('Is_Restricted',        'integer', ["precision" => 1])
            ->addColumn('Level_Catch',          'integer', ["precision" => 3])
            ->addColumn('Level_Mania',          'integer', ["precision" => 3])
            ->addColumn('Level_Standard',       'integer', ["precision" => 3])
            ->addColumn('Level_Stdev',          'integer', ["precision" => 3])
            ->addColumn('Level_Taiko',          'integer', ["precision" => 3])
            ->addColumn('Name',                 'string',  ["precision" => 27])
            ->addColumn('PP_Catch',             'decimal', ['precision' => 8, 'scale' => 2])
            ->addColumn('PP_Mania',             'decimal', ['precision' => 8, 'scale' => 2])
            ->addColumn('PP_Standard',          'decimal', ['precision' => 8, 'scale' => 2])
            ->addColumn('PP_Stdev',             'decimal', ['precision' => 8, 'scale' => 2])
            ->addColumn('PP_Taiko',             'decimal', ['precision' => 8, 'scale' => 2])
            ->addColumn('PP_Total',             'decimal', ['precision' => 8, 'scale' => 2])
            ->addColumn('Rank_Global_Catch',    'integer', ["precision" => 20])
            ->addColumn('Rank_Global_Mania',    'integer', ["precision" => 20])
            ->addColumn('Rank_Global_Standard', 'integer', ["precision" => 20])
            ->addColumn('Rank_Global_Taiko',    'integer', ["precision" => 20])
            ->addColumn('Rarest_Medal_Achieved','datetime',[])
            ->addColumn('Rarest_Medal_ID',      'integer', ["precision" => 4])
            ->create();


        $table = $this->table('Rankings_Script_History', ['id' => false, 'primary_key' => ['ID']]);
        $table
            ->addColumn('ID', 'integer', ["precision" => 8])
            ->addColumn('Type', 'string', ['precision' => 30])
            ->addColumn('Time', 'timestamp')
            ->addColumn('Count_Current', 'integer', ["precision" => 11])
            ->addColumn('Count_Total', 'integer', ["precision" => 11])
            ->addColumn('Elapsed_Seconds', 'integer', ["precision" => 20])
            ->addColumn('Elapsed_Last_Update', 'timestamp')
            ->create();

    }
}
