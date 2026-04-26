<?php
$user = API\Osu\User::GetUser($args[0]);
$medals = \Data\Medals::GetAll()->content;


$graph_medalPercentageOverTimeRelative = [];
$graph_medalPercentageOverTimeTotal = [];

// collect all release dates
$releaseDates = array_column($medals, 'Date_Released');
sort($releaseDates);

// collect all achieved dates
$achievedDates = array_column($user['user_achievements'], 'achieved_at');
sort($achievedDates);

// walk through both sorted arrays together
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

    $graph_medalPercentageOverTime[] = [
            'date' => min($release, $achieved),
            'percentage' => round(($totalAchieved / $totalReleased) * 100, 2),
            'achieved' => $totalAchieved,
            'released' => $totalReleased,
    ];
}

$deduped = [];
foreach ($graph_medalPercentageOverTime as $point) {
    $day = substr($point['date'], 0, 10);
    $deduped[$day] = $point;
}
$graph_medalPercentageOverTime = array_values($deduped);

$totalMedals = count($releaseDates);
$totalAchieved = 0;
foreach ($achievedDates as $date) {
    $totalAchieved++;
    $graph_medalPercentageOverTimeTotal[] = [
            'date' => $date,
            'percentage' => round(($totalAchieved / $totalMedals) * 100, 2),
            'achieved' => $totalAchieved,
    ];
}
?>

<pre><?= json_encode($graph_medalPercentageOverTimeRelative, JSON_PRETTY_PRINT) ?></pre>