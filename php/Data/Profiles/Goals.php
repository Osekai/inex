<?php

namespace Data\Profiles;

use API\Response;
use Database\Connection;
use Database\Session;

class Goals
{
    // every goal type lives here, add new ones to this list
    // api gets the user + that mode's statistics
    // rankings gets the Rankings_Users row + the column suffix (Standard, Taiko, Catch, Mania)
    static function Types(): array
    {
        return [
            "pp" => [
                "Name" => "PP",
                "Icon" => "icon-goals-pp",
                "Lower_Is_Better" => false,
                "api" => function ($user, $stats) {
                    return $stats['pp'] ?? null;
                },
                "rankings" => function ($row, $mode) {
                    return $row['PP_' . $mode] ?? null;
                },
            ],
            "rank" => [
                "Name" => "Global Rank",
                "Icon" => "icon-goals-rank",
                "Lower_Is_Better" => true,
                "api" => function ($user, $stats) {
                    return $stats['global_rank'] ?? null;
                },
                "rankings" => function ($row, $mode) {
                    return $row['Rank_Global_' . $mode] ?? null;
                },
            ],
            "country-rank" => [
                "Name" => "Country Rank",
                "Icon" => "icon-goals-country-rank",
                "Lower_Is_Better" => true,
                "api" => function ($user, $stats) {
                    return $stats['country_rank'] ?? null;
                },
                "rankings" => null, // not in the table
            ],
            "medals" => [
                "Name" => "Medals",
                "Icon" => "icon-goals-medals",
                "Lower_Is_Better" => false,
                "Per_Mode" => false,
                "api" => function ($user, $stats) {
                    return count($user['user_achievements'] ?? []);
                },
                "rankings" => function ($row, $mode) {
                    return $row['Count_Medals'] ?? null;
                },
            ],
            "medals-percent" => [
                "Name" => "% Medals",
                "Icon" => "icon-goals-medals",
                "Lower_Is_Better" => false,
                "Per_Mode" => false,
                "api" => function ($user, $stats) {
                    $total = Goals::TotalMedals();
                    if ($total == 0) return null;
                    return round(count($user['user_achievements'] ?? []) / $total * 100, 2);
                },
                "rankings" => function ($row, $mode) {
                    $total = Goals::TotalMedals();
                    if ($total == 0 || $row['Count_Medals'] === null) return null;
                    return round($row['Count_Medals'] / $total * 100, 2);
                },
            ],
            "level" => [
                "Name" => "Level",
                "Icon" => "icon-goals-level",
                "Lower_Is_Better" => false,
                "api" => function ($user, $stats) {
                    return $stats['level']['current'] ?? null;
                },
                "rankings" => function ($row, $mode) {
                    return $row['Level_' . $mode] ?? null;
                },
            ],
            "ss-count" => [
                "Name" => "SS Count",
                "Icon" => "icon-goals-ss-count",
                "Lower_Is_Better" => false,
                "api" => function ($user, $stats) {
                    if (!isset($stats['grade_counts'])) return null;

                    // gold + silver ss
                    return $stats['grade_counts']['ss'] + $stats['grade_counts']['ssh'];
                },
                "rankings" => function ($row, $mode) {
                    if ($row['Count_SS_' . $mode] === null && $row['Count_SSH_' . $mode] === null) return null;

                    return $row['Count_SS_' . $mode] + $row['Count_SSH_' . $mode];
                },
            ],
            "ranked-score" => [
                "Name" => "Ranked Score",
                "Icon" => "icon-goals-ranked-score",
                "Lower_Is_Better" => false,
                "api" => function ($user, $stats) {
                    return $stats['ranked_score'] ?? null;
                },
                "rankings" => null, // only total score is stored
            ],
            "badges" => [
                "Name" => "Badges",
                "Icon" => "icon-goals-badges",
                "Lower_Is_Better" => false,
                "Per_Mode" => false,
                "api" => function ($user, $stats) {
                    return count($user['badges'] ?? []);
                },
                "rankings" => function ($row, $mode) {
                    return $row['Count_Badges'] ?? null;
                },
            ],
        ];
    }

    static function TotalMedals(): int
    {
        return (int)Connection::execSimpleSelect("SELECT COUNT(*) AS Count FROM Medals_Data", "medals_total_count", 600)[0]['Count'];
    }

    // types without the closures, for the frontend
    public static function TypesPublic(): Response
    {
        $types = [];
        foreach (Goals::Types() as $key => $type) {
            $types[] = [
                "Key" => $key,
                "Name" => $type['Name'],
                "Icon" => $type['Icon'],
                "Lower_Is_Better" => $type['Lower_Is_Better'],
                "Per_Mode" => $type['Per_Mode'] ?? true,
            ];
        }
        return new Response(true, "Success", $types);
    }

    public static function Add($type, $value, $gamemode): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!\Data\OsekaiUsers::HasPermission("profiles.goals.edit", true)) return new Response(false, "You can't do that");
        $userId = Session::UserData()['id'];

        $types = Goals::Types();
        if (!isset($types[$type])) return new Response(false, "Invalid goal type");

        if (!is_numeric($value) || (float)$value <= 0) return new Response(false, "Invalid value");

        // stored as catch, the api side converts back to fruits
        if ($gamemode == "fruits") $gamemode = "catch";
        if (!in_array($gamemode, ["osu", "taiko", "catch", "mania"])) return new Response(false, "Invalid gamemode");

        if (isset($types[$type]['Per_Mode']) && $types[$type]['Per_Mode'] === false) {
            $gamemode = null;
        }

        $existing = Connection::execSelect("SELECT ID FROM Profiles_Goals WHERE User_ID = ? AND Type = ? AND Value = ? AND Gamemode <=> ?", "isss", [$userId, $type, $value, $gamemode]);
        if (count($existing) > 0) return new Response(false, "You already have this goal");

        Connection::execOperation("INSERT INTO Profiles_Goals (User_ID, Value, Type, Gamemode, Creation_Date) VALUES (?, ?, ?, ?, NOW())", "isss", [$userId, $value, $type, $gamemode]);

        return Goals::Get($userId);
    }

    public static function Delete($id): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!\Data\OsekaiUsers::HasPermission("profiles.goals.edit", true)) return new Response(false, "You can't do that");
        $userId = Session::UserData()['id'];

        if (!is_numeric($id)) return new Response(false, "Invalid goal");

        Connection::execOperation("DELETE FROM Profiles_Goals WHERE ID = ? AND User_ID = ?", "ii", [$id, $userId]);

        return Goals::Get($userId);
    }

    public static function Get($user, $dataPassthrough = false): Response
    {
        $profile = $user;
        if(!$dataPassthrough) $profile = \Data\Profiles::Get($user)->content;
        $goals = Goals::Update($profile);

        return new Response(true, "Success", $goals);
    }

    public static function Update($user): array
    {
        $profile = $user;
        if (is_numeric($user)) {
            $profile = \Data\Profiles::Get($user)->content;
        }
        $osuUser = $profile['User'];

        $types = Goals::Types();
        $goals = Connection::execSelect("SELECT * FROM Profiles_Goals WHERE User_ID = ?", "i", [$osuUser['id']]);

        foreach ($goals as &$goal) {
            $current = null;

            if (isset($types[$goal['Type']]) && $types[$goal['Type']]['api'] !== null) {
                // osu api calls catch "fruits"
                $mode = $goal['Gamemode'];
                if ($mode == "catch") $mode = "fruits";

                $stats = $osuUser['statistics'] ?? null;
                if ($mode !== null) {
                    $stats = $osuUser['statistics_rulesets'][$mode] ?? null;
                }

                $current = $types[$goal['Type']]['api']($osuUser, $stats);
            }

            $goal = Goals::Check($goal, $current);
        }

        return $goals;
    }

    public static function UpdateQuick($userId): array
    {
        $row = Connection::execSelect("SELECT * FROM Rankings_Users WHERE ID = ?", "i", [$userId]);
        if (count($row) == 0) return [];
        $row = $row[0];

        $types = Goals::Types();
        $goals = Connection::execSelect("SELECT * FROM Profiles_Goals WHERE User_ID = ?", "i", [$userId]);

        foreach ($goals as &$goal) {
            $current = null;

            if (isset($types[$goal['Type']]) && $types[$goal['Type']]['rankings'] !== null) {
                // column suffix in Rankings_Users
                $mode = "Standard";
                if ($goal['Gamemode'] == "taiko") $mode = "Taiko";
                if ($goal['Gamemode'] == "catch") $mode = "Catch";
                if ($goal['Gamemode'] == "mania") $mode = "Mania";

                $current = $types[$goal['Type']]['rankings']($row, $mode);
            }

            $goal = Goals::Check($goal, $current);
        }

        return $goals;
    }

    // works out progress, and claims the goal if it's done
    static function Check($goal, $current)
    {
        $types = Goals::Types();
        $target = (float)$goal['Value'];
        $lowerIsBetter = $types[$goal['Type']]['Lower_Is_Better'] ?? false;

        $complete = false;
        $progress = null;

        if ($current !== null && $target > 0) {
            if ($lowerIsBetter) {
                // rank 0 means unranked, not first place
                $complete = $current > 0 && $current <= $target;
                $progress = 0;
                if ($current > 0) {
                    $progress = min(1, $target / $current);
                }
            } else {
                $complete = $current >= $target;
                $progress = min(1, $current / $target);
            }
        }

        if ($complete && $goal['Claimed'] === null) {
            Connection::execOperation("UPDATE Profiles_Goals SET Claimed = NOW() WHERE ID = ?", "i", [$goal['ID']]);
            $goal['Claimed'] = date("Y-m-d H:i:s");
        }

        $goal['Current_Value'] = $current;
        $goal['Progress'] = $progress;
        return $goal;
    }
}