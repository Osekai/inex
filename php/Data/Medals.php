<?php

namespace Data;

use API\Response;
use Database\Connection;
use Database\Memcache;
use Database\Session;

class Medals
{
    static function GetAll(): Response
    {
        return new Response(true, "Success", Connection::execSimpleSelect("
        SELECT *, Medals_Data.Medal_ID as Medal_ID FROM Medals_Data 
        LEFT JOIN Medals_Configuration ON Medals_Data.Medal_ID = Medals_Configuration.Medal_ID
        ", "medals", 60));
    }

    static function GetBeatmaps($medal_id, $single = null): Response {
        $vars = "i";
        $inp = [$medal_id];
        $cache = 10;
        if($single !== null) {
            $vars .= "i";
            $inp[] = $single;
            $cache = 0;
        }
        return new Response(true, "Success", Connection::execSelect("
    SELECT Medals_Beatmaps.*, Beatmaps_Data.*, COUNT(Common_Votes.User_ID) AS VoteCount 
    FROM Medals_Beatmaps 
    LEFT JOIN Beatmaps_Data ON Medals_Beatmaps.Beatmap_ID = Beatmaps_Data.Beatmap_ID
    LEFT JOIN Common_Votes ON Common_Votes.Target_Table = 'Medals_Beatmaps' AND Common_Votes.Target_ID = Medals_Beatmaps.ID
    WHERE Medals_Beatmaps.Medal_ID = ? " . ($single == null ? "" : "AND Medals_Beatmaps.Beatmap_ID = ? ") . " GROUP BY Medals_Beatmaps.Beatmap_ID  ORDER BY VoteCount DESC", $vars, $inp, "medals_beatmaps_" . $medal_id, $cache));
    }
    static function WipeBeatmapCache($medal_id) {
        Memcache::remove("medals_beatmap2s_" . $medal_id);
    }


    static function AddNote($id, $note) {
        Connection::execOperation("UPDATE `Medals_Beatmaps` SET `Note` = ?, `Note_Submitted_User_ID` = ?, `Note_Submitted_Date` = CURRENT_TIMESTAMP WHERE `ID` = ?;", "sii", [$note, Session::UserData()['id'], $id]);
    }
    static function AddBeatmap($link, $medal, $note = null): Response {
        if(!Session::LoggedIn()) return new Response(false, "logged out");
        $link = str_replace("https://osu.ppy.sh/beatmapsets/", "", $link);
        $link = explode("?", $link)[0];
        $id = explode("/", $link)[1];

        if(!is_numeric($id) || $id == "") {
            return new Response(false, "Invalid Link " . $id);
        }

        $medal = Medals::Get($medal);
        if($medal == null) return new Response(false, "Invalid");
        if($medal['Is_Restricted'] == 1) return new Response(false, "Not Allowed");

        $beatmap = Beatmaps::GetBeatmap($id);

        if($beatmap['Status'] == "graveyard" || $beatmap['Status'] == "pending" || $beatmap['Status'] == "wip") {
            return new Response(false, "Map is graveyarded");
        }

        Beatmaps::StoreBeatmap($beatmap);
        Connection::execOperation("INSERT INTO `Medals_Beatmaps` (`Medal_ID`, `Beatmap_ID`, `Beatmap_Submitted_User_ID`, `Beatmap_Submitted_Date`)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP());", "iii", [$medal, $id, Session::UserData()['id']]);

        self::WipeBeatmapCache($medal);

        $beatmap = self::GetBeatmaps($medal, $id)->content[0];

        if($note != null) {
            self::AddNote($beatmap['ID'], $note);
            $beatmap = self::GetBeatmaps($medal, $id)->content[0];
        }

        return new Response(true, "", $beatmap);
    }

    public static function Save($id, $data)
    {
        if($data['Date_Released'] == "") $data['Date_Released'] = null;
        if($data['First_Achieved_Date'] == "") $data['First_Achieved_Date'] = null;

        Memcache::remove("medals");

        return new Response(true, "Success", Connection::execOperation("
        UPDATE Medals_Configuration
        SET Solution = ?, Is_Solution_Found = ?, Video_URL = ?, Is_Lazer = ?, Is_Restricted = ?, Date_Released = ?, First_Achieved_Date = ?, First_Achieved_User_ID = ?
        WHERE Medal_ID = ?
        ", "sisiissii", [$data['Solution'], $data['Is_Solution_Found'], $data['Video_URL'], $data['Is_Lazer'], $data['Is_Restricted'], $data['Date_Released'], $data['First_Achieved_Date'], $data['First_Achieved_User_ID'], $data['Medal_ID']]));
    }

    public static function Get(mixed $id)
    {
        $medal = Connection::execSelect("
        SELECT *, Medals_Data.Medal_ID as Medal_ID FROM Medals_Data 
        LEFT JOIN Medals_Configuration ON Medals_Data.Medal_ID = Medals_Configuration.Medal_ID
        WHERE Medals_Data.Medal_ID = ?
        ", "i", [$id], "medals_".$id, 60);
        if(count($medal) == 0) return null;
        return $medal[0];
    }
}