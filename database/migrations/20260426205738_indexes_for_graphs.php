<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class IndexesForGraphs extends AbstractMigration
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
        $table = $this->table('Rankings_Users_Medals');
        $table->addIndex(['Achieved_At'], ['name' => 'idx_achieved_at'])
            ->addIndex(['User_ID', 'Achieved_At'], ['name' => 'idx_user_achieved_at'])
            ->update();

        $table = $this->table('Medals_Configuration');
        $table->addIndex(['Date_Released'], ['name' => 'idx_date_released'])
            ->update();

        $table = $this->table('Common_Comments');
        $table->addIndex(['Target_ID', 'Target_Table'], ['name' => 'idx_target'])
            ->addIndex(['User_ID'], ['name' => 'idx_user_id'])
            ->addIndex(['Parent_Comment_ID'], ['name' => 'idx_parent_comment'])
            ->update();

        $table = $this->table('Common_Votes');
        $table->addIndex(['User_ID'], ['name' => 'idx_user_id'])
            ->update();

        $table = $this->table('Medals_Beatmaps');
        $table->addIndex(['Medal_ID'], ['name' => 'idx_medal_id'])
            ->addIndex(['Beatmap_ID'], ['name' => 'idx_beatmap_id'])
            ->update();

        $table = $this->table('Badges_Users');
        $table->addIndex(['User_ID'], ['name' => 'idx_user_id'])
            ->update();

        $table = $this->table('System_Roles_Assignments');
        $table->addIndex(['Role_ID'], ['name' => 'idx_role_id'])
            ->update();
    }
}
