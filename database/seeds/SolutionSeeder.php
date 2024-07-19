<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

class SolutionSeeder extends AbstractSeed
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
        // pulls solutions from osekai (please run scripts for the actual medal data!)
        $api = json_decode(file_get_contents("https://osekai.net/medals/api/medals.php"), true);

        $data = [];
        $mods_data = [];

        foreach ($api as $medal) {
            if(str_contains($medal['Date'], "0000")) $medal['Date'] = null;
            if($medal['FirstAchievedDate'] != null && str_contains($medal['FirstAchievedDate'], "0000")) $medal['FirstAchievedDate'] = null;
            if($medal['FirstAchievedBy'] == 0) $medal['FirstAchievedBy'] = null;


            if($medal['Video'] == "") $medal['Video'] = null;
            if($medal['Locked'] == null) $medal['Locked'] = 0;

            $data[] = [
                "Medal_ID" => $medal['MedalID'],
                "Video_URL" => $medal['Video'],
                "First_Achieved_Date" => $medal['FirstAchievedDate'] ,
                "First_Achieved_User_ID" => $medal['FirstAchievedBy'],
                "Is_Solution_Found" => $medal['SolutionFound'],
                "Is_Lazer" => $medal['Lazer'],
                "Is_Restricted" => $medal['Locked'],
                "Solution" => $medal['Solution'],
                "Date_Released" => $medal['Date'],
            ];


            $mods = $medal["Mods"];
            if($mods != null) {
                $mods = explode(',', $mods);
                foreach ($mods as $mod) {
                    $mods_data[] = [
                        "Medal_ID" => $medal['MedalID'],
                        "Mod" => $mod,
                    ];
                }
            }
        }

        $posts = $this->table('Medals_Configuration');
        $posts->truncate();
        $posts->insert($data)
            ->saveData();

        $posts = $this->table('Medals_Solutions_Mods');
        $posts->truncate();
        $posts->insert($mods_data)
            ->saveData();
    }
}
