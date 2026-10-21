<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class MoreRankingColumns extends AbstractMigration
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

        $table->addColumn('Join_Date', 'datetime', ['null' => true])
            ->addColumn('Rank_Country_Catch', 'integer', ['null' => true])
            ->addColumn('Rank_Country_Mania', 'integer', ['null' => true])
            ->addColumn('Rank_Country_Standard', 'integer', ['null' => true])
            ->addColumn('Rank_Country_Taiko', 'integer', ['null' => true])
            ->addColumn('Ranked_Score_Catch', 'biginteger', ['null' => true])
            ->addColumn('Ranked_Score_Mania', 'biginteger', ['null' => true])
            ->addColumn('Ranked_Score_Standard', 'biginteger', ['null' => true])
            ->addColumn('Ranked_Score_Taiko', 'biginteger', ['null' => true])
            ->update();
    }
}
