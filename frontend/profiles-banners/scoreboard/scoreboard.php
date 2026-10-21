<?php
$user = $qu['User'];
$stats = $user['statistics'];
$grades = $stats['grade_counts'] ?? [];

$modeNames = [
    "osu" => "osu!",
    "taiko" => "osu!taiko",
    "fruits" => "osu!catch",
    "catch" => "osu!catch",
    "mania" => "osu!mania",
];
// $mode comes from the renderer, the banner's own mode and not the user's default one
$modeName = $modeNames[$mode] ?? "osu!";

// shows a dash when the api gives us nothing (inactive players have no rank)
function sb_num($value, $decimals = 0) {
    if ($value === null) return "-";
    return number_format($value, $decimals);
}

$countryRank = $stats['country_rank'] ?? null;
$ss = ($grades['ss'] ?? 0) + ($grades['ssh'] ?? 0);
$s = ($grades['s'] ?? 0) + ($grades['sh'] ?? 0);
$a = $grades['a'] ?? 0;
?>
<div class="bg-elements">
    <pb-gamemode-icon></pb-gamemode-icon>
</div>
<div class="scoreboard">
    <pb-pfp></pb-pfp>
    <div class="main">
        <div class="head">
            <div class="who">
                <h1><?= htmlspecialchars($user['username']) ?></h1>
                <p class="sub"><?= $modeName ?> <span>/</span> <?= htmlspecialchars($user['country_code'] ?? "") ?> #<?= sb_num($countryRank) ?></p>
            </div>
            <div class="rank">
                <p class="label">global rank</p>
                <p class="big"><span>#</span><?= sb_num($stats['global_rank']) ?></p>
            </div>
        </div>
        <div class="foot">
            <div class="cells">
                <div>
                    <p class="label">pp</p>
                    <p class="val"><?= sb_num($stats['pp']) ?></p>
                </div>
                <div>
                    <p class="label">accuracy</p>
                    <p class="val"><?= sb_num($stats['hit_accuracy'], 2) ?>%</p>
                </div>
                <div>
                    <p class="label">plays</p>
                    <p class="val"><?= sb_num($stats['play_count']) ?></p>
                </div>
                <div>
                    <p class="label">max combo</p>
                    <p class="val"><?= sb_num($stats['maximum_combo']) ?>x</p>
                </div>
            </div>
            <div class="grades">
                <div class="g-ss"><b>SS</b><?= sb_num($ss) ?></div>
                <div class="g-s"><b>S</b><?= sb_num($s) ?></div>
                <div class="g-a"><b>A</b><?= sb_num($a) ?></div>
            </div>
        </div>
    </div>
</div>
<div class="watermark">
    <img src="/public/img/branding/app/profiles.svg">
    <p>Osekai Profiles <span>osekai.net</span></p>
</div>
