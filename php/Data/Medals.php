<?php

namespace Data;

use API\Response;
use Database\Connection;
use Database\Memcache;
use Tasks\Runners\BeatmapPacks;

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

    public static function Get(mixed $id)
    {
        $medal = Connection::execSelect("
        SELECT *, Medals_Data.Medal_ID as Medal_ID FROM Medals_Data 
        LEFT JOIN Medals_Configuration ON Medals_Data.Medal_ID = Medals_Configuration.Medal_ID
        WHERE Medals_Data.Medal_ID = ?
        ", "i", [$id], "medals_" . $id, 60);
        if (count($medal) == 0) return null;
        return $medal[0];
    }

    public static function Save($id, $data)
    {
        foreach ($data as $key => $value) {
            if ($value === "null") $data[$key] = null;
        }

        if ($data['Date_Released'] == "") $data['Date_Released'] = null;
        if ($data['First_Achieved_Date'] == "") $data['First_Achieved_Date'] = null;

        Memcache::remove("medals");

        $mods = explode(",", $data['Mods']);

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


        return new Response(true, "Success", Connection::execOperation("
        UPDATE Medals_Configuration
        SET Solution = ?, Is_Solution_Found = ?, Video_URL = ?, Supports_Lazer = ?, Supports_Stable = ?, Is_Restricted = ?, Date_Released = ?, First_Achieved_Date = ?, First_Achieved_User_ID = ?
        WHERE Medal_ID = ?
        ", "sisiiissii", [$data['Solution'], $data['Is_Solution_Found'], $data['Video_URL'], $data['Supports_Lazer'], $data['Supports_Stable'], $data['Is_Restricted'], $data['Date_Released'], $data['First_Achieved_Date'], $data['First_Achieved_User_ID'], $data['Medal_ID']]));
    }

}