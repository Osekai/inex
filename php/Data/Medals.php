<?php

namespace Data;

use API\Response;
use Caching;
use Database\Connection;
use Database\Memcache;
use Database\Session;
use Discord;
use Jfcherng\Diff\Differ;
use Jfcherng\Diff\Renderer\RendererConstant;
use Jfcherng\Diff\Renderer\Text\Unified;
use Tasks\Runners\BeatmapPacks;

class Medals
{
    static function GetAll(): Response
    {
        return new Response(true, "Success", Connection::execSimpleSelect("
        SELECT 
            Medals_Data.*, 
            Medals_Configuration.*, 
            GROUP_CONCAT(Medals_Solutions_Mods.Mod SEPARATOR ',') as Mods, 
            GROUP_CONCAT(Medals_Solutions_Beatmaps_Packs.Pack_ID SEPARATOR ',') as Packs,
            FirstAchievedUser.Name AS First_Achieved_Username
        FROM Medals_Data
        LEFT JOIN Medals_Configuration ON Medals_Data.Medal_ID = Medals_Configuration.Medal_ID
        LEFT JOIN Medals_Solutions_Mods ON Medals_Solutions_Mods.Medal_ID = Medals_Data.Medal_ID
        LEFT JOIN Medals_Solutions_Beatmaps_Packs ON Medals_Solutions_Beatmaps_Packs.Medal_ID = Medals_Data.Medal_ID
        LEFT JOIN Merged_Users FirstAchievedUser ON FirstAchievedUser.User_ID = Medals_Configuration.First_Achieved_User_ID
        GROUP BY Medals_Data.Medal_ID
        "));
    }

    public static function Save($id, $data)
    {
        if (!\Data\OsekaiUsers::HasPermission("medal.edit", false)) return new Response(false, "no");

        foreach ($data as $key => $value) {
            if ($value === "null") $data[$key] = null;
        }


        if ($data['Date_Released'] == "") $data['Date_Released'] = null;
        if ($data['First_Achieved_Date'] == "") $data['First_Achieved_Date'] = null;

        Memcache::remove("medals");

        $mods = explode(",", $data['Mods']);


        $oldMedal = Medals::Get($data['Medal_ID'], 0);


        Connection::execOperation("DELETE FROM Medals_Solutions_Mods WHERE Medal_ID = ?", "i", [$data['Medal_ID']]);
        if ($data['Mods'] != null) {
            foreach ($mods as $mod) {
                Connection::execOperation("INSERT INTO Medals_Solutions_Mods (Medal_ID, `Mod`) VALUES (?, ?)", "is", [$data['Medal_ID'], $mod]);
            }
        }

        ///
        $newlyAdded = 0;

        $oldPacks = Connection::execSelect("SELECT * FROM Medals_Solutions_Beatmaps_Packs WHERE Medal_ID = ?", "i", [$data['Medal_ID']]);
        $newPackIds = [];

        if ($data['Pack_osu'] !== null) $newPackIds["osu"] = $data['Pack_osu'];
        if ($data['Pack_taiko'] !== null) $newPackIds["taiko"] = $data['Pack_taiko'];
        if ($data['Pack_catch'] !== null) $newPackIds["catch"] = $data['Pack_catch'];
        if ($data['Pack_mania'] !== null) $newPackIds["mania"] = $data['Pack_mania'];

        $alreadyAdded = [];
// Iterate through old packs and compare against values of $newPackIds
        for ($x = 0; $x < count($oldPacks); $x++) {
            // Compare Pack_ID with values of $newPackIds, which contains the new pack IDs
            if (!in_array($oldPacks[$x]['Pack_ID'], $newPackIds)) {
                // If the old Pack_ID isn't in $newPackIds, delete it from the database
                Connection::execOperation("DELETE FROM Medals_Solutions_Beatmaps_Packs WHERE Medal_ID = ? AND Pack_ID = ?", "is", [$data['Medal_ID'], $oldPacks[$x]['Pack_ID']]);
            } else {
                // If it is, add it to the list of already added packs
                $alreadyAdded[] = $oldPacks[$x]['Pack_ID'];
            }
        }

// Add new packs that are not in $alreadyAdded
        foreach ($newPackIds as $key => $value) {
            if (!in_array($value, $alreadyAdded)) {
                $newlyAdded++;
                Connection::execOperation("INSERT INTO Medals_Solutions_Beatmaps_Packs (Medal_ID, Pack_ID, Gamemode) VALUES (?, ?, ?)", "iss", [$data['Medal_ID'], $value, $key]);
            }
        }

        $bpu = (new BeatmapPacks());
        $bpu->log = false;
        $bpu->etirun([]);
        ///


        Connection::execOperation("
        UPDATE Medals_Configuration
        SET Solution = ?, Is_Solution_Found = ?, Video_URL = ?, Supports_Lazer = ?, Supports_Stable = ?, Is_Restricted = ?, Date_Released = ?, First_Achieved_Date = ?, First_Achieved_User_ID = ?
        WHERE Medal_ID = ?
        ", "sisiiissii", [$data['Solution'], $data['Is_Solution_Found'], $data['Video_URL'], $data['Supports_Lazer'], $data['Supports_Stable'], $data['Is_Restricted'], $data['Date_Released'], $data['First_Achieved_Date'], $data['First_Achieved_User_ID'], $data['Medal_ID']]);


        // variable exists $oldMedal
        $newMedal = Medals::Get($data['Medal_ID'], 0);

        $changes = []; // Array to store changed values

        foreach ($newMedal as $key => $newValue) {
            if (isset($oldMedal[$key]) && strtolower(trim($oldMedal[$key])) !== strtolower(trim($newValue))) {
                $changes[$key] = [
                        'old' => $oldMedal[$key],
                        'new' => $newValue
                ];
            }
        }
        $changes_txt = "";

        foreach ($changes as $field => $change) {
            $changes_txt .= "## {$field}\n";

            $old_content = $change['old'];
            $new_content = $change['new'];

            // Create the diff using the Differ class
            $differ = new Differ(explode("\n", $old_content), explode("\n", $new_content));

            // Use the Unified renderer for a Git-style diff
            $renderer = new Unified(['context' => 3, 'cliColorization' => RendererConstant::CLI_COLOR_AUTO]);

            // Render the diff as a Git-style diff
            $diff_txt = $renderer->render($differ);

            // Remove the "No newline at end of file" message
            $diff_txt = str_replace("\ No newline at end of file", "", $diff_txt);

            // Remove the first line that starts with @@ (diff header line)
            $diff_txt = preg_replace('/^@@ .+ @@$/m', '', $diff_txt);

            // Wrap the diff in a code block with the 'diff' language for Git diff style
            $changes_txt .= "```diff\n{$diff_txt}\n```\n";
        }


        $embeds = [[
                'title' => $oldMedal['Name'],
                'description' => 'Edited by ' . Session::UserData()['username'],
                'color' => 0xff66aa // Red color in decimal
        ], [
                "title" => "Changes",
                "description" => $changes_txt
        ]];
        $messageData = Discord::postDiscordEmbeds(MOD_WEBHOOK_EDITS, $embeds);


        return new Response(true, "Success", []);
    }

    public static function Get(mixed $id, $cacheLength = 60)
    {
        $medal = Connection::execSelect("
        SELECT Medals_Data.*, Medals_Configuration.*, GROUP_CONCAT(Medals_Solutions_Mods.Mod SEPARATOR ',') as Mods, GROUP_CONCAT(Medals_Solutions_Beatmaps_Packs.Pack_ID SEPARATOR ',') as Packs FROM Medals_Data 
        LEFT JOIN Medals_Configuration ON Medals_Data.Medal_ID = Medals_Configuration.Medal_ID
        LEFT JOIN Medals_Solutions_Mods ON Medals_Solutions_Mods.Medal_ID = Medals_Data.Medal_ID
        LEFT JOIN Medals_Solutions_Beatmaps_Packs ON Medals_Solutions_Beatmaps_Packs.Medal_ID = Medals_Data.Medal_ID
        WHERE Medals_Data.Medal_ID = ?
        GROUP BY Medals_Data.Medal_ID
        ", "i", [$id], "medals_" . $id, $cacheLength);
        if (count($medal) == 0) return null;
        return $medal[0];
    }

    public static function Suggestions()
    {
        $userid = Session::UserData()['id'];

        // IMPORTANT: this takes like, 10 seconds!
        $user = OsekaiUsers::GetUser($userid, "osu");
        $osuUser = $user;
        $catchUser = OsekaiUsers::GetUser($userid, "fruits");
        $taikoUser = OsekaiUsers::GetUser($userid, "taiko");
        $maniaUser = OsekaiUsers::GetUser($userid, "mania");
        //echo "<pre>" . json_encode($user, JSON_PRETTY_PRINT) . "</pre>";

        $hits = [
                "osu" =>   $osuUser  ['statistics']['play_time'],
                "catch" => $catchUser['statistics']['play_time'],
                "taiko" => $taikoUser['statistics']['play_time'],
                "mania" => $maniaUser['statistics']['play_time'],
        ];


        $userMedalIds = array_column($user['user_achievements'], 'achievement_id');
        $ourCount = count($userMedalIds);

        $placeholders = implode(',', array_fill(0, count($userMedalIds), '?'));
        $types = 'i' . str_repeat('i', count($userMedalIds));


        if ($ourCount < 60) {
            echo "You need at least 60 medals to get suggestions!";
            return;
        }
        $scores = Caching::Layer("medala_suggestions_" . $userid, function () use ($types, $ourCount, $userMedalIds, $placeholders) {
            $scores = [];
            Connection::execSelectStream(
                    "SELECT rum.User_ID, rum.Medal_ID
         FROM Rankings_Users_Medals rum
         INNER JOIN Rankings_Users ru ON ru.ID = rum.User_ID AND ru.Count_Medals >= ?
         WHERE rum.User_ID IN (
             SELECT User_ID
             FROM Rankings_Users_Medals
             WHERE Medal_ID IN ($placeholders)
             GROUP BY User_ID
             HAVING COUNT(*) >= 60
         )",
                    $types,
                    array_merge([$ourCount - 20], $userMedalIds),
                    function ($row) use (&$scores, $userMedalIds) {
                        $medalId = $row['Medal_ID'];
                        if (!in_array($medalId, $userMedalIds)) {
                            $scores[$medalId] = ($scores[$medalId] ?? 0) + 1;
                        }
                    }
            );
            return $scores;
        }, 0.1); // cache for 1 hour

        arsort($scores);

        $medalIds = array_keys($scores);
        $placeholders2 = implode(',', array_fill(0, count($medalIds), '?'));
        $types2 = str_repeat('i', count($medalIds));

        $frequencies = Connection::execSelect(
                "SELECT Medal_ID, Frequency FROM Medals_Data WHERE Medal_ID IN ($placeholders2)",
                $types2,
                $medalIds
        );

        $freqMap = array_column($frequencies, 'Frequency', 'Medal_ID');

        $medals = Medals::GetAll();
        foreach ($scores as $medalId => $coOccurrence) {
            // main scoring algo
            $freq = $freqMap[$medalId] ?? 1;

            // the less rare the medal, the easier it is (probably) - so you should go get it
            $scores[$medalId] = $coOccurrence * pow((float)$freq, 0.9);
            $scores[$medalId] = $scores[$medalId] * 500;

            $medal = null;
            foreach ($medals->content as $medalData) {
                if ($medalData['Medal_ID'] == $medalId) {
                    $medal = $medalData;
                }
            }

            // if it's an FC it's probably hard
            if (str_contains($medal['Solution'], "FC"))
                $scores[$medalId] = $scores[$medalId] * 0.7;

            // if it's a PFC it's probably even harder
            if (str_contains($medal['Solution'], "PFC"))
                $scores[$medalId] = $scores[$medalId] * 0.6;
            if (str_contains($medal['Solution'], "Pass any ranked"))
                $scores[$medalId] = $scores[$medalId] * 1.3;

            // if the solution is super long it's gonna be complex, so we push it down a bit
            $solutionLength = strlen($medal['Solution'] ?? '');
            $lengthPenalty = 1 / log(max($solutionLength, 70)); // not much though
            $scores[$medalId] *= $lengthPenalty;

            preg_match('/[\d,]+/', $medal['Name'], $matches);
            if (!empty($matches)) {
                $num = (int)str_replace(',', '', $matches[0]);
                // if there's a number in the title that probably means it's a combo/plays/keys/etc medal
                // these can be pushed down since it's basically "do you have spare time?"
                if($num > 10000) $num = 10000;
                $penalty = 1 / (1 + log($num / 400, 12));
                $scores[$medalId] *= $penalty;

            }

            if (str_contains($medal['Grouping'], "Hush")) {
                // hush-hush medals are more fun!
                $scores[$medalId] *= 3.3;
            }
            if (str_contains($medal['Grouping'], "Pack") || str_contains($medal['Grouping'], "Spotlight")) {
                // pack medals are NOT fun
                $scores[$medalId] *= 0.2;
            }

            if (str_contains($medal['Grouping'], "Dedication")) {
                // not that exciting
                $scores[$medalId] *= 0.9;
            }

            preg_match('/<star-rating>(\d+\+?)<\/star-rating>/', $medal['Solution'], $matches);
            if (!empty($matches)) {
                $rating = $matches[1]; // "6" or "6+"
                $isPlus = str_ends_with($rating, '+');
                $num = (int)$rating;

                if($num <= 3) {
                    // under 3 star map, probably easy
                    $scores[$medalId] *= 6;
                }
                if($num > 6) {
                    $scores[$medalId] *= 0.5;
                }
            }

            if($medal['Gamemode'] == "") $medal['Gamemode'] = "osu"; // TODO: this should just be their most played mode instead of osu hardcoded
            $scores[$medalId] *= pow($hits[$medal['Gamemode']]/100000, 1.03);
        }
        unset($score);

        arsort($scores);
        $topMedals = array_slice($scores, 0, 20, true);

        $readableMedalScores = [];
        foreach ($topMedals as $medalId => &$score) {
            foreach ($medals->content as $medal) {
                if ($medal['Medal_ID'] == $medalId) {
                    $readableMedalScores[] = [
                            "Medal" => (int)$medal['Medal_ID'],
                            "Score" => round($score, 4)
                    ];
                }
            }
        }

        return new Response(true, "Success", $readableMedalScores);
    }
}