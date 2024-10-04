<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

class ModSeeder extends AbstractSeed
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

        $rulesets = json_decode(file_get_contents("https://raw.githubusercontent.com/ppy/osu-web/659347f10f12f83d6b0d8d27400692b471b51e3c/database/mods.json"), true);

        foreach($rulesets as $ruleset) {
            $ruleset_name = $ruleset['Name'];
            foreach($ruleset['Mods'] as $mod) {
                print_r($mod);
                echo $mod['Type'];
                $type = strtolower($mod['Type']);
                $type = str_replace(" ", "", $type);
                $data[] = [
                    "ID" => $mod['Acronym'],
                    "Name" => $mod['Name'],
                    "Type" => $type,
                    "Description" => $mod['Description'],
                    "Gamemode" => $ruleset_name
                ];
            }
        }

        $posts = $this->table('Common_Mods');
        $posts->truncate();
        $posts->insert($data)
            ->saveData();
    }
}
