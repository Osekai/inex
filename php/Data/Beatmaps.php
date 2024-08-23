<?php

namespace Data;

use API\Response;
use Database\Connection;
use Database\Memcache;
use API\Osu\Beatmaps;
use API\Osu\Beatmapsets;

class Beatmaps
{
    public static function SaveMedalSolution($medal_id, $beatmap_id) {
        SaveBeatmap($beatmap_id);
        SaveMedalRelation($medal_id, $beatmap_id);
    }

    public static function SaveBeatmap($beatmap_id) {
        echo "test1";
        $Beatmap = New Beatmap();
        $Beatmapset = New Beatmapset();

        $Data_Beatmap = $Beatmap->GetBeatmap($beatmap_id);
        $Data_Betmapset = $Beatmapset->GetBeatmapset($Data_Beatmap['beatmapset_id']);

        return new Response(true, "Success", Connection::execOperation("
        REPLACE INTO beatmaps_data (Beatmap_ID, Beatmapset_ID, Mapper_ID, Gamemode, Song_Title, Song_Artist, Mapper_Name, Difficulty_Rating, Difficulty_Name, Download_Unavailable)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", "iiissssdsi", [$beatmap_id, $Data_Beatmap['beatmapset_id'], $Data_Beatmapset['user_id'], $Data_Beatmap['mode'], $Data_Beatmapset['title'], $Data_Beatmapset['creator'], $Data_Beatmap['difficulty_rating'], $Data_Beatmap['version'], $Data_Beatmapset['availability.download_disabled']]));
    }

    public static function SaveMedalRelation($medal_id, $beatmap_id) {
        if(Database\Session::LoggedIn()) {
            $user_id = Database\Session::UserData()['ID'];
        } else {
            return [];
        }

        return new Response(true, "Success", Connection::execOperation("
        INSERT INTO medals_beatmaps (Medal_ID, Beatmap_ID, Beatmap_Submitted_User_ID, Beatmap_Submitted_Date)
        VALUES (?, ?, ?, CURDATE())
        WHERE NOT EXISTS (SELECT 1 FROM medals_beatmaps WHERE Medal_ID = ? AND Beatmap_ID = ?
        ", "iiiii", [$medal_id, $beatmap_id, $user_id, $medal_id, $beatmap_id]));
    }
}