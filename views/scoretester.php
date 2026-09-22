<?php
function GenerateScoreForUser($id)
{
    $user = \Database\Connection::execSelect("SELECT * FROM Rankings_Users WHERE ID = ?", "i", [$id])[0];
    $contributions = \Database\Connection::execSelect("SELECT
  u.ID,
  u.Name,
  (SELECT COUNT(*) FROM Common_Comments c
     WHERE c.User_ID = u.ID AND c.Deleted = 0)                   AS Comments,
  (SELECT COUNT(*) FROM Common_Votes v
     WHERE v.User_ID = u.ID)                                     AS Votes,
  (SELECT COUNT(*) FROM Medals_Beatmaps b
     WHERE b.Beatmap_Submitted_User_ID = u.ID AND b.Deleted = 0)  AS Beatmaps_Submitted,
  (SELECT COUNT(*) FROM Medals_Beatmaps b
     WHERE b.Note_Submitted_User_ID = u.ID AND b.Deleted = 0)     AS Notes_Submitted
FROM Rankings_Users u
WHERE u.ID = ?;", "i", [$id])[0];
    $user['Comments'] = $contributions['Comments'];
    $user['Votes'] = $contributions['Votes'];
    $user['Beatmaps_Submitted'] = $contributions['Beatmaps_Submitted'];

    $score = 1;
    $score += ((-10 + $user['Count_Medals']) / 3);
    $score += ($user['Count_Badges'] * 0.4);
    $score += ($user['Count_Subscribers'] * 0.002);
    $score += ($user['PP_Stdev'] * 0.001);

    $score += ($user['Count_Maps_Ranked'] * 0.1);
    $score += ($user['Count_Maps_Loved'] * 0.2);

    $score += ($user['Count_Replays_Watched'] * 0.000001);


    $pp = 0;
    if ($user['PP_Catch'] !== null) $pp += $user['PP_Catch'];
    if ($user['PP_Taiko'] !== null) $pp += $user['PP_Taiko'];
    if ($user['PP_Mania'] !== null) $pp += $user['PP_Mania'];
    if ($user['PP_Standard'] !== null) $pp += $user['PP_Standard'];

    $score += ($pp * 0.0001);


    $contributionScore = -1;
    $contributionScore += $user['Comments'] * 1.2;
    $contributionScore += $user['Votes'] * 0.03;
    $contributionScore += $user['Beatmaps_Submitted'] * 1.8;

    $score += $contributionScore / 3;

    if ($user['Is_Restricted']) {
        $score /= 4;
    }


    $score = round((float)$score, 2);


    $score = max(1, $score);

    $user['Score'] = $score;
    $user['ContributionScore'] = $contributionScore;
    return $user;
}

$checks = [
    [
        'id' => 2,
        'reason' => "peppy"
    ],
    [
        'id' => 3656717,
        'reason' => "accuracy stdev #1, accuracy total #1"
    ],
    [
        'id' => 10334943,
        'reason' => "accuracy stdev #12"
    ],
    [
        'id' => 2607498,
        'reason' => "accuracy stdev #26"
    ],
    [
        'id' => 7113352,
        'reason' => "accuracy stdev #71"
    ],
    [
        'id' => 5427801,
        'reason' => "accuracy stdev #84"
    ],
    [
        'id' => 18630149,
        'reason' => "accuracy total #26"
    ],
    [
        'id' => 7215423,
        'reason' => "accuracy total #29"
    ],
    [
        'id' => 37230882,
        'reason' => "accuracy total #47"
    ],
    [
        'id' => 6096445,
        'reason' => "accuracy total #63"
    ],
    [
        'id' => 12408961,
        'reason' => "badges #1"
    ],
    [
        'id' => 702598,
        'reason' => "badges #7"
    ],
    [
        'id' => 7813296,
        'reason' => "badges #8"
    ],
    [
        'id' => 4830687,
        'reason' => "badges #68"
    ],
    [
        'id' => 3196091,
        'reason' => "badges #89"
    ],
    [
        'id' => 2660111,
        'reason' => "level stdev #1"
    ],
    [
        'id' => 5299293,
        'reason' => "level stdev #31"
    ],
    [
        'id' => 4815717,
        'reason' => "level stdev #44"
    ],
    [
        'id' => 13199768,
        'reason' => "level stdev #73, medals #76"
    ],
    [
        'id' => 2089876,
        'reason' => "level stdev #89"
    ],
    [
        'id' => 7966003,
        'reason' => "level total #1"
    ],
    [
        'id' => 11296097,
        'reason' => "level total #56"
    ],
    [
        'id' => 4734244,
        'reason' => "level total #63"
    ],
    [
        'id' => 10480961,
        'reason' => "level total #76"
    ],
    [
        'id' => 4964095,
        'reason' => "level total #83"
    ],
    [
        'id' => 214187,
        'reason' => "loved maps #1"
    ],
    [
        'id' => 2127359,
        'reason' => "loved maps #7"
    ],
    [
        'id' => 2640467,
        'reason' => "loved maps #21"
    ],
    [
        'id' => 8647138,
        'reason' => "loved maps #62"
    ],
    [
        'id' => 3087654,
        'reason' => "loved maps #69"
    ],
    [
        'id' => 4687701,
        'reason' => "medals #1"
    ],
    [
        'id' => 10218998,
        'reason' => "medals #12"
    ],
    [
        'id' => 11294546,
        'reason' => "medals #37"
    ],
    [
        'id' => 9939642,
        'reason' => "medals #52"
    ],
    [
        'id' => 5795337,
        'reason' => "playtime total #1"
    ],
    [
        'id' => 3099689,
        'reason' => "playtime total #23"
    ],
    [
        'id' => 6701104,
        'reason' => "playtime total #26"
    ],
    [
        'id' => 7094393,
        'reason' => "playtime total #67"
    ],
    [
        'id' => 9773619,
        'reason' => "playtime total #92"
    ],
    [
        'id' => 9169747,
        'reason' => "pp stdev #1, pp total #1"
    ],
    [
        'id' => 14095291,
        'reason' => "pp stdev #13"
    ],
    [
        'id' => 15266747,
        'reason' => "pp stdev #61"
    ],
    [
        'id' => 30122510,
        'reason' => "pp stdev #72"
    ],
    [
        'id' => 2206844,
        'reason' => "pp stdev #86"
    ],
    [
        'id' => 17753122,
        'reason' => "pp total #11"
    ],
    [
        'id' => 10072733,
        'reason' => "pp total #29"
    ],
    [
        'id' => 3970664,
        'reason' => "pp total #84"
    ],
    [
        'id' => 12264918,
        'reason' => "pp total #91"
    ],
    [
        'id' => 33599,
        'reason' => "ranked maps #1"
    ],
    [
        'id' => 1980256,
        'reason' => "ranked maps #29"
    ],
    [
        'id' => 1623405,
        'reason' => "ranked maps #80"
    ],
    [
        'id' => 8001433,
        'reason' => "ranked maps #92"
    ],
    [
        'id' => 4741164,
        'reason' => "ranked maps #96"
    ],
    [
        'id' => 39828,
        'reason' => "replays watched #1"
    ],
    [
        'id' => 713266,
        'reason' => "replays watched #46"
    ],
    [
        'id' => 2094566,
        'reason' => "replays watched #90"
    ],
    [
        'id' => 4937439,
        'reason' => "replays watched #93"
    ],
    [
        'id' => 343865,
        'reason' => "replays watched #99"
    ],
    [
        'id' => 4452992,
        'reason' => "subscribers #1"
    ],
    [
        'id' => 2805457,
        'reason' => "subscribers #41"
    ],
    [
        'id' => 11403815,
        'reason' => "subscribers #68"
    ],
    [
        'id' => 7354729,
        'reason' => "subscribers #81"
    ],
    [
        'id' => 4539930,
        'reason' => "subscribers #96"
    ],
    [
        'id' => 3,
        'reason' => "BanchoBot - bot account, edge case"
    ],
    [
        'id' => 102,
        'reason' => "nekodex - staff, osu! composer"
    ],
    [
        'id' => 18983,
        'reason' => "Doomsday - staff"
    ],
    [
        'id' => 102335,
        'reason' => "Ephemeral - staff"
    ],
    [
        'id' => 1040328,
        'reason' => "smoogipoo - developer"
    ],
    [
        'id' => 3178418,
        'reason' => "pishifat - mapping staff"
    ],
    [
        'id' => 124493,
        'reason' => "Cookiezi / chocomint - historic osu! legend"
    ],
    [
        'id' => 7562902,
        'reason' => "mrekk - top osu! player"
    ],
    [
        'id' => 4504101,
        'reason' => "WhiteCat - top osu! player"
    ],
    [
        'id' => 4787150,
        'reason' => "Vaxei - top osu! player"
    ],
    [
        'id' => 2558286,
        'reason' => "Rafis - historic top player"
    ],
    [
        'id' => 4650315,
        'reason' => "idke - historic top player"
    ],
    [
        'id' => 2757689,
        'reason' => "Toy - top osu! player"
    ],
    [
        'id' => 6170507,
        'reason' => "_yu68 - top taiko player"
    ],
    [
        'id' => 758406,
        'reason' => "dressurf - top mania player"
    ],
    [
        'id' => 4158549,
        'reason' => "YesMyDarknesss - top catch player"
    ],
    [
        'id' => 165027,
        'reason' => "active omh user"
    ],
    [
        'id' => 11417629,
        'reason' => "active omh user"
    ],
    [
        'id' => 34693820,
        'reason' => "active omh user"
    ],
    [
        'id' => 21497069,
        'reason' => "active omh user"
    ],
    [
        'id' => 39388424,
        'reason' => "active omh user"
    ],
    [
        'id' => 10379965,
        'reason' => "meee :3"
    ],

];

$results = [];
foreach ($checks as $check) {
    $score = GenerateScoreForUser($check['id']);
    $score['Reason'] = $check['reason'];
    $results[] = $score;
}

usort($results, fn($a, $b) => $b['Score'] <=> $a['Score']);

echo "<div class='grid'>";
foreach ($results as $score) {
    echo "<div>";
    echo "<p>" . $score['Reason'] . "</p>";
    echo "<h1>" . $score['Name'] . "</h1>";
    echo "<h2>" . $score['Score'] . "</h2>";
    echo "<small>" . $score['ContributionScore'] . " CScore (" . $score['Comments'] . " C, " . $score['Votes'] . " V, " . $score['Beatmaps_Submitted'] . " B)</small>";
    echo "</div>";
}
echo "</div>";
?>
<style>
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 5px;

        > div {
            border: 1px solid blue;
            padding: 12px;
            display: flex;
            flex-direction: column;

            h2 {
                margin-top: auto;
                padding-top: 10px;
            }

            h1 {
                font-size: 20px;
            }
        }
    }
</style>
