<?php

declare(strict_types=1);

namespace eti\runners;

use eti\AbstractRunner;
use GuzzleHttp\Client;
use GuzzleHttp\Promise;


class Beatmaps extends AbstractRunner
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
        function removeDuplicates($array, $key)
        {
            $temp_array = [];
            $key_array = [];

            foreach ($array as $val) {
                if (!in_array($val[$key], $key_array)) {
                    $key_array[] = $val[$key];
                    $temp_array[] = $val;
                }
            }
            return $temp_array;
        }

        function detectUnsupportedCharacters($string)
        {
            // Define a pattern for unsupported characters (anything outside basic multilingual plane)
            $pattern = '/[\x{10000}-\x{10FFFF}]/u'; // Unicode characters outside the BMP

            // Find all matches
            preg_match_all($pattern, $string, $matches);

            // Return the matches
            return $matches[0];
        }

        // pulls solutions from osekai (please run scripts for the actual medal data!)
        $api = json_decode(file_get_contents("https://osekai.net/medals/api/medals.php"), true);

        $b_data = [];
        $a_data = [];

        $client = new Client();
        $promises = [];

        $medalcount = 0;
        foreach ($api as $medal) {
            $medalcount++;
        }
        $done = 0;

        foreach ($api as $medal) {
            if (!($medal['PackID'] == null || $medal['PackID'] == "")) continue;
            $promises[] = $client->postAsync('https://osekai.net/medals/api/beatmaps.php', [
                'form_params' => [
                    'strSearch' => $medal['Name']
                ]
            ])->then(function ($response) use ($medal, &$b_data, &$a_data) {
                global $done;
                global $medalcount;
                $beatmaps = json_decode($response->getBody()->getContents(), true);
                $done++;
                echo "..." . $done . "/" . $medalcount . "\n";
                foreach ($beatmaps as $beatmap) {
                    if ($beatmap['Gamemode'] == "fruits") $beatmap['Gamemode'] = "catch";
                    $data = [
                        "Beatmap_ID" => $beatmap['BeatmapID'],
                        "Beatmapset_ID" => $beatmap['MapsetID'],
                        "Mapper_ID" => $beatmap['MapperID'],
                        "Gamemode" => $beatmap['Gamemode'],
                        "Song_Title" => $beatmap['SongTitle'],
                        "Song_Artist" => $beatmap['Artist'],
                        "Mapper_Name" => $beatmap['Mapper'],
                        "Difficulty_Rating" => $beatmap['Difficulty'],
                        "Difficulty_Name" => $beatmap['DifficultyName'],
                        "Download_Unavailable" => $beatmap['DownloadUnavailable']
                    ];
                    $b_data[] = $data;
                    $a_data[] = [
                        "Medal_ID" => $medal['MedalID'],
                        "Beatmap_ID" => $beatmap['BeatmapID'],
                        "Beatmap_Submitted_User_ID" => $beatmap['SubmittedBy'],
                        "Beatmap_Submitted_Date" => $beatmap['SubmissionDate'],
                        "Note" => $beatmap['Note']
                    ];

                    $note = $beatmap['Note'];
                    $unsupportedChars = detectUnsupportedCharacters($note);
                    if (!empty($unsupportedChars)) {
                        echo "Unsupported characters detected in MedalID {$medal['MedalID']} and BeatmapID {$beatmap['BeatmapID']}: " . implode(", ", $unsupportedChars) . PHP_EOL;
                    }
                }
            });
        }

        // Wait for all requests to complete

        Promise\Utils::settle($promises)->wait();

        $b_data = removeDuplicates($b_data, 'Beatmap_ID');

        $posts = $this->table('Beatmaps_Data');
        $posts->truncate();
        $posts->insert($b_data)
            ->saveData();

        $posts = $this->table('Medals_Beatmaps');
        $posts->truncate();
        $posts->insert($a_data)
            ->saveData();
    }
}
