<?php

namespace Data;


use API\Osu\Beatmap;
use Database\Connection;

class Beatmaps
{
    public static function GetBeatmap($beatmap_id, $get_db = true)
    {
        if ($get_db) {
            $db = Connection::execSelect("SELECT * FROM Beatmaps_Data WHERE Beatmap_ID = ?", "i", [$beatmap_id]);

            if (count($db) > 0) {
                return $db[0];
            }
        }

        $data = Beatmap::GetBeatmap($beatmap_id);

        if($data['mode'] == "fruits") $data['mode'] = "catch";

        $normalized_data = [
            "Beatmap_ID" => $data['id'],
            "Beatmapset_ID" => $data['beatmapset_id'],
            "Mapper_ID" => $data['user_id'],
            "Gamemode" => $data['mode'],
            "Song_Title" => $data['beatmapset']['title'],
            "Song_Artist" => $data['beatmapset']['artist'],
            "Mapper_Name" => $data['beatmapset']['creator'],
            "Difficulty_Rating" => $data['difficulty_rating'],
            "Difficulty_Name" => $data['version'],
            "Download_Unavailable" => 0, // this is never used in ui i dont know why we store this
            "Status" => $data['beatmapset']['status']
        ];

        return $normalized_data;
    }

    public static function StoreBeatmap($beatmap_info)
    {
        Connection::execOperation("REPLACE INTO Beatmaps_Data (
                           Beatmap_ID, Beatmapset_ID, Mapper_ID, Gamemode,
                           Song_Title, Song_Artist, Mapper_Name, Difficulty_Rating,
                           Difficulty_Name, Download_Unavailable, Status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "iiissssdsis", array_values($beatmap_info)
        );
    }
}