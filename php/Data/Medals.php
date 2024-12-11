<?php

namespace Data;

use API\Response;
use Database\Connection;
use Database\Memcache;
use Database\Session;
use Discord;
use Jfcherng\Diff\Differ;
use Jfcherng\Diff\Renderer\RendererConstant;
use Jfcherng\Diff\Renderer\Text\Unified;
use Tasks\Runners\BeatmapPacks;
use Woeler\DiscordPhp\Message\DiscordEmbedMessage;
use Woeler\DiscordPhp\Webhook\DiscordWebhook;

class Medals
{
    static function GetAll(): Response
    {
        return new Response(true, "Success", Connection::execSimpleSelect("
        SELECT Medals_Data.*, Medals_Configuration.*, GROUP_CONCAT(Medals_Solutions_Mods.Mod SEPARATOR ',') as Mods, GROUP_CONCAT(Medals_Solutions_Beatmaps_Packs.Pack_ID SEPARATOR ',') as Packs FROM Medals_Data 
        LEFT JOIN Medals_Configuration ON Medals_Data.Medal_ID = Medals_Configuration.Medal_ID
        LEFT JOIN Medals_Solutions_Mods ON Medals_Solutions_Mods.Medal_ID = Medals_Data.Medal_ID
        LEFT JOIN Medals_Solutions_Beatmaps_Packs ON Medals_Solutions_Beatmaps_Packs.Medal_ID = Medals_Data.Medal_ID
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

}