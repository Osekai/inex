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
        $mods = [
            "NF" => "No Fail",
            "EZ" => "Easy",
            "HD" => "Hidden",
            "HR" => "Hard Rock",
            "SD" => "Sudden Death",
            "DT" => "Double Time",
            "RX" => "Relax",
            "HT" => "Half Time",
            "NC" => "Nightcore",
            "FL" => "Flashlight",
            "AT" => "Autoplay",
            "SO" => "Spun Out",
            "AP" => "Autopilot",
            "PF" => "Perfect",
            "1K" => "1 Key",
            "2K" => "2 Keys",
            "3K" => "3 Keys",
            "4K" => "4 Keys",
            "5K" => "5 Keys",
            "6K" => "6 Keys",
            "7K" => "7 Keys",
            "8K" => "8 Keys",
            "9K" => "9 Keys",
            "FI" => "Fade In",
            "CO" => "Co-Op",
        ];

        $data = [];

        foreach($mods as $key => $value) {
            $data[] = [
                "ID" => $key,
                "Name" => $value
            ];
        }

        $posts = $this->table('Common_Mods');
        $posts->insert($data)
            ->saveData();
    }
}
