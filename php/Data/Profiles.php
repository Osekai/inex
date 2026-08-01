<?php

namespace Data;

use API\Osu\User;
use API\Response;
use Database\Connection;
use Debug\Timings;

class Profiles
{
    static function Get($id) {
        $x = new Timings("profiles_fetch");
        $user = \Caching::Layer("profiles_user_fetch_" . $id, function() use ($id) {
            return User::GetUser($id);
        });
        $x->finish();

        if($user == null) return new Response(false, "User not found");

        $x = new Timings("profiles_medals");
        $medals = Medals::GetAll()->content;
        $x->finish();


        $graph_medalPercentageOverTimeRelative = [];
        $graph_medalPercentageOverTimeTotal = [];

        $releaseDates = array_column($medals, 'Date_Released');
        sort($releaseDates);

        $achievedDates = array_column($user['user_achievements'], 'achieved_at');
        sort($achievedDates);

        $totalReleased = 0;
        $totalAchieved = 0;
        $r = 0;
        $a = 0;

        while ($r < count($releaseDates) || $a < count($achievedDates)) {
            $release = $releaseDates[$r] ?? PHP_INT_MAX;
            $achieved = $achievedDates[$a] ?? PHP_INT_MAX;

            if ($release <= $achieved) {
                $totalReleased++;
                $r++;
            } else {
                $totalAchieved++;
                $a++;
            }
            if ($totalAchieved < 1) continue;
            $graph_medalPercentageOverTimeRelative[] = [
                'Date' => min($release, $achieved),
                'Percentage' => round(($totalAchieved / $totalReleased) * 100, 2),
                'Achieved' => $totalAchieved,
                'Released' => $totalReleased,
            ];
        }

        $graph_medalPercentageOverTimeRelative[] = [
            'Date' => date('Y-m-d\TH:i:s\Z'),
            'Percentage' => round(($totalAchieved / $totalReleased) * 100, 2),
            'Achieved' => $totalAchieved,
            'Released' => $totalReleased,
        ];

        $deduped = [];
        foreach ($graph_medalPercentageOverTimeRelative as $point) {
            $day = substr($point['Date'], 0, 10);
            $deduped[$day] = $point;
        }
        $graph_medalPercentageOverTimeRelative = array_values($deduped);

        $totalMedals = count($releaseDates);
        $totalAchieved = 0;
        foreach ($achievedDates as $date) {
            $totalAchieved++;
            $graph_medalPercentageOverTimeTotal[] = [
                'Date' => $date,
                'Percentage' => round(($totalAchieved / $totalMedals) * 100, 2),
                'Achieved' => $totalAchieved,
                'Released' => $totalMedals,
            ];
        }

        $graph_medalPercentageOverTimeTotal[] = [
            'Date' => date('Y-m-d\TH:i:s\Z'),
            'Percentage' => round(($totalAchieved / $totalMedals) * 100, 2),
            'Achieved' => $totalAchieved,
            'Released' => $totalMedals,
        ];


        $osekaiUser = Connection::execSelect("
    SELECT 
        u.*,
        r.Rank_Medals_Global,
        r.Rank_Medals_Country,
        r.Rank_PP_Total_Global,
        r.Rank_PP_Total_Country,
        r.Rank_PP_Stdev_Global,
        r.Rank_PP_Stdev_Country
    FROM Rankings_Users u
LEFT JOIN (
    SELECT
        ru.ID,
        ru.Country_Code,
        ROW_NUMBER() OVER (
            ORDER BY ru.Count_Medals DESC, md.Count_Achieved_By ASC
        ) AS Rank_Medals_Global,
        ROW_NUMBER() OVER (
            PARTITION BY ru.Country_Code
            ORDER BY ru.Count_Medals DESC, md.Count_Achieved_By ASC
        ) AS Rank_Medals_Country,
        ROW_NUMBER() OVER (ORDER BY ru.PP_Total DESC)                           AS Rank_PP_Total_Global,
        ROW_NUMBER() OVER (PARTITION BY ru.Country_Code ORDER BY ru.PP_Total DESC) AS Rank_PP_Total_Country,
        ROW_NUMBER() OVER (ORDER BY ru.PP_Stdev DESC)                           AS Rank_PP_Stdev_Global,
        ROW_NUMBER() OVER (PARTITION BY ru.Country_Code ORDER BY ru.PP_Stdev DESC) AS Rank_PP_Stdev_Country
    FROM Rankings_Users ru
    LEFT JOIN Medals_Data md ON md.Medal_ID = ru.Rarest_Medal_ID
    WHERE ru.Is_Restricted = 0
) AS r ON r.ID = u.ID
    WHERE u.ID = ?
", "i", [$id])[0];

        foreach($medals as &$medal) {
            $medal['Obtained'] = false;
            $medal['Obtained_Date'] = null;
            foreach($user['user_achievements'] as $achievement) {
                if($achievement['achievement_id'] == $medal['Medal_ID']) {
                    $medal['Obtained'] = true;
                    $medal['Obtained_Date'] = $achievement['achieved_at'];
                }
            }
        }

        return new Response(true, "ok", [
            "User" => $user,
            "Medals" => $medals,
            "Graphs" => [
                "MedalPercentageOverTime" => [
                    "Relative" => $graph_medalPercentageOverTimeRelative,
                    "Total" => $graph_medalPercentageOverTimeTotal,
                ]
            ],
            "Statistics" => [
                "Medals" => [
                    "TotalReleased" => $totalReleased,
                    "TotalAchieved" => $totalAchieved,
                    "Percentage" => round(($totalAchieved / $totalMedals) * 100, 2),
                    "Ranks" => [
                        "Global" => $osekaiUser['Rank_Medals_Global'],
                        "Country" => $osekaiUser['Rank_Medals_Country'],
                    ],
                ],
                "AllMode" => [
                    "Stdev" => [
                        "Global" => $osekaiUser['Rank_PP_Stdev_Global'],
                        "Country" => $osekaiUser['Rank_PP_Stdev_Country'],
                        "PP" => $osekaiUser['PP_Stdev'],

                        "Accuracy" => $osekaiUser['Accuracy_Stdev'],
                    ],
                    "Total" => [
                        "Global" => $osekaiUser['Rank_PP_Total_Global'],
                        "Country" => $osekaiUser['Rank_PP_Total_Country'],
                        "PP" => $osekaiUser['PP_Total'],
                        "Accuracy" => $osekaiUser['Accuracy_Catch'] + $osekaiUser['Accuracy_Mania'] +
                            $osekaiUser['Accuracy_Taiko'] + $osekaiUser['Accuracy_Standard']
                    ],

                ]
            ]
        ]);
    }
}