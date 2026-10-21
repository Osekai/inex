<?php

namespace Data\Profiles;

use API\Response;
use Database\Connection;

class Leaderboard
{
    const LIMIT = 25;

    // type is "pp" or "medals", for pp "" is all mode which ranks on standard deviated pp
    public static function Get($mode, $type = "pp"): Response
    {
        if ($mode === "fruits") $mode = "catch";

        if ($type === "medals") {
            $rows = Connection::execSelect("SELECT ID, Name, Country_Code, Count_Medals AS Value,
                ROW_NUMBER() OVER (ORDER BY Count_Medals DESC) AS `Rank`
                FROM Rankings_Users
                WHERE Is_Restricted = 0
                ORDER BY Count_Medals DESC LIMIT ?", "i", [self::LIMIT], "profiles_leaderboard_medals", 300);
            return new Response(true, "Success", $rows);
        }
        if ($type !== "pp") return new Response(false, "Invalid type");

        // column names come from this list only, never from the request
        $columns = [
            "osu" => "Standard",
            "taiko" => "Taiko",
            "catch" => "Catch",
            "mania" => "Mania",
        ];

        if ($mode === "") {
            $rows = Connection::execSelect("SELECT ID, Name, Country_Code, PP_Stdev AS Value,
                ROW_NUMBER() OVER (ORDER BY PP_Stdev DESC) AS `Rank`
                FROM Rankings_Users
                WHERE Is_Restricted = 0
                ORDER BY PP_Stdev DESC LIMIT ?", "i", [self::LIMIT], "profiles_leaderboard_all", 300);
            return new Response(true, "Success", $rows);
        }

        if (!isset($columns[$mode])) return new Response(false, "Invalid mode");
        $column = $columns[$mode];

        $rows = Connection::execSelect("SELECT ID, Name, Country_Code, PP_$column AS Value, Rank_Global_$column AS `Rank`
            FROM Rankings_Users
            WHERE Is_Restricted = 0 AND Rank_Global_$column > 0
            ORDER BY Rank_Global_$column ASC LIMIT ?", "i", [self::LIMIT], "profiles_leaderboard_" . $mode, 300);
        return new Response(true, "Success", $rows);
    }
}
