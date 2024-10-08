<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

class RoleSeeder extends AbstractSeed
{
    /**
     * Run Method.
     *
     * Write your database seeder using this method.
     *
     * More information on writing seeders is available here:
     * https://book.cakephp.org/phinx/0/en/seeding.html
     */
    public function run(): void
    {
        $data = [];

        function AddRole(&$data, $id, $shortname, $longname, $colour, $perms, $blockedperms)
        {
            $data[] = [
                "ID" => $id,
                "Name_Short" => $shortname,
                "Name_Long" => $longname,
                "Colour" => $colour,
                "Permissions" => json_encode($perms),
                "Blocked_Permissions" => json_encode($blockedperms)
            ];
        }

        AddRole($data, 100, "DEV", "Developer", "#7E95FB", ["*.*"], []);
        AddRole($data, 90, "MOD", "Moderator", "#416541", ["*.*"], []);
        AddRole($data, 10, "icon:globe", "Translator", "#A24794", [], []);

        AddRole($data, 1, "icon:heart", "Supporter : Tier 1", "#FF66AA", [], []);
        AddRole($data, 2, "icon:heart icon:heart", "Supporter : Tier 2", "#FF66AA", [], []);
        AddRole($data, 3, "icon:heart icon:heart icon:heart", "Supporter : Tier 3", "#FF66AA", [], []);

        AddRole($data, -1, "RST", "Restricted", null, [], ["comments.submit", "beatmaps.submit"]);


        $posts = $this->table('System_Roles_Roles');
        $posts->truncate();
        $posts->insert($data)
            ->saveData();
    }
}
