<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class IndexesForSuggestions extends AbstractMigration
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
        $this->table('Rankings_Users_Medals')
            ->addIndex(['Medal_ID'], ['name' => 'idx_medal_id'])
            ->save();

        $this->table('Rankings_Users')
            ->addIndex(['Count_Medals'], ['name' => 'idx_count_medals'])
            ->save();
    }
}
