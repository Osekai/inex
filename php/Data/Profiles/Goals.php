<?php

namespace Data\Profiles;

use API\Response;
use Database\Connection;

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
                "Lower_Is_Better" => true,
                "api" => function ($user, $stats) {
                    return $stats['country_rank'] ?? null;
                },
                "rankings" => null, // not in the table
            ],
            "medals" => [
                "Name" => "Medals",
                "Icon" => "aicon-medal",
                "Lower_Is_Better" => false,
                "api" => function ($user, $stats) {
                    return count($user['user_achievements'] ?? []);
                },
                "rankings" => function ($row, $mode) {
                    return $row['Count_Medals'] ?? null;
                },
            ],
            "level" => [
                "Name" => "Level",
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
                "Lower_Is_Better" => false,
                "api" => function ($user, $stats) {
                    return $stats['ranked_score'] ?? null;
                },
                "rankings" => null, // only total score is stored
            ],
            "badges" => [
                "Name" => "Badges",
                "Lower_Is_Better" => false,
                "api" => function ($user, $stats) {
                    return count($user['badges'] ?? []);
                },
                "rankings" => function ($row, $mode) {
                    return $row['Count_Badges'] ?? null;
                },
            ],
        ];
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