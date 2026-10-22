<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RemoveRankCountryColumns extends AbstractMigration
{
    // osu doesn't send country rank in the bulk users response, so these were never filled
    public function up(): void
    {
        $this->table('Rankings_Users')
            ->removeColumn('Rank_Country_Catch')
            ->removeColumn('Rank_Country_Mania')
            ->removeColumn('Rank_Country_Standard')
            ->removeColumn('Rank_Country_Taiko')
            ->update();
    }

    public function down(): void
    {
        $this->table('Rankings_Users')
            ->addColumn('Rank_Country_Catch', 'integer', ['null' => true])
            ->addColumn('Rank_Country_Mania', 'integer', ['null' => true])
            ->addColumn('Rank_Country_Standard', 'integer', ['null' => true])
            ->addColumn('Rank_Country_Taiko', 'integer', ['null' => true])
            ->update();
    }
}
