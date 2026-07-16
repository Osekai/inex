<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RankingUpdate extends AbstractMigration
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
        $table = $this->table('Rankings_Users');

        $table->addColumn('Count_SS_Catch', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SS_Mania', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SS_Standard', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SS_Taiko', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SSH_Catch', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SSH_Mania', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SSH_Standard', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SSH_Taiko', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_S_Catch', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_S_Mania', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_S_Standard', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_S_Taiko', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SH_Catch', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SH_Mania', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SH_Standard', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_SH_Taiko', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_A_Catch', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_A_Mania', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_A_Standard', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Count_A_Taiko', 'integer', ['limit' => 6, 'null' => true])
            ->addColumn('Total_Hits_Catch', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Total_Hits_Mania', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Total_Hits_Standard', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Total_Hits_Taiko', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Play_Time_Catch', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Play_Time_Mania', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Play_Time_Standard', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Play_Time_Taiko', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Play_Count_Catch', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Play_Count_Mania', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Play_Count_Standard', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Play_Count_Taiko', 'integer', ['limit' => 10, 'null' => true])
            ->addColumn('Total_Score_Catch', 'biginteger', ['null' => true])
            ->addColumn('Total_Score_Mania', 'biginteger', ['null' => true])
            ->addColumn('Total_Score_Standard', 'biginteger', ['null' => true])
            ->addColumn('Total_Score_Taiko', 'biginteger', ['null' => true])
            ->addColumn('Kudosu_Total', 'integer', ['limit' => 6, 'null' => true])
            ->update();
    }
}
