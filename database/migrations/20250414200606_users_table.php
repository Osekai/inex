<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UsersTable extends AbstractMigration
{
    public function up()
    {
        // Create a view that merges data from Rankings_Users and System_Users
        $sql = "
            CREATE VIEW Merged_Users AS
            SELECT Rankings_Users.ID AS User_ID, Rankings_Users.Name AS Name
            FROM Rankings_Users
            UNION
            SELECT System_Users.User_ID AS User_ID, System_Users.Name AS Name
            FROM System_Users
        ";

        // Execute the SQL to create the view
        $this->execute($sql);
    }

    public function down()
    {
        // Drop the view if rolling back the migration
        $this->execute("DROP VIEW IF EXISTS Merged_Users");
    }
}
