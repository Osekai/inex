<?php
// rarest = lowest frequency out of the ones they have
$rarest = null;
foreach ($qu['Medals'] as $medal) {
    if (!$medal['Obtained']) continue;
    if ($rarest === null || $medal['Frequency'] < $rarest['Frequency']) {
        $rarest = $medal;
    }
}

$stats = $qu['User']['statistics'];

// the closure keeps this from clashing with other themes' helpers
$num = function ($value) {
    if ($value === null) return "-";
    return number_format($value);
};

$seconds = $stats['play_time'] ?? 0;
$playTime = floor($seconds / 86400) . "d " . floor(($seconds % 86400) / 3600) . "h " . floor(($seconds % 3600) / 60) . "m";

$medalsObtained = $qu['Statistics']['Medals']['TotalAchieved'];
$medalsTotal = count($qu['Medals']);
?>

<div class="content-inner">
    <div>
        <pb-pfp></pb-pfp>
        <p><?= htmlspecialchars($qu['User']['username']) ?></p>
        <pb-gamemode-icon></pb-gamemode-icon>
    </div>
    <div>
        <div>
            <h4>play time</h4>
            <div></div>
            <p><?= $playTime ?></p>
        </div>
        <div>
            <h4>pp</h4>
            <div></div>
            <p><?= $num($stats['pp']) ?></p>
        </div>
    </div>
    <div>
        <div>
            <h4>rank</h4>
            <div></div>
            <p><?= $num($stats['global_rank']) ?></p>
        </div>
        <div>
            <h4>country rank</h4>
            <div></div>
            <p><?= $num($stats['country_rank'] ?? null) ?></p>
        </div>
    </div>
    <div>
        <div>
            <h4>medals</h4>
            <div></div>
            <p><?= $medalsObtained ?>/<?= $medalsTotal ?></p>
        </div>
        <div>
            <h4>rarest medal</h4>
            <div></div>
            <p><?= $rarest !== null ? htmlspecialchars($rarest['Name']) : "-" ?></p>
        </div>
    </div>
    <div class="footer">
        <div>
            <img src="/public/img/branding/app/profiles.svg">
            <p>Osekai Profiles</p>
        </div>
        <div>
            https://osekai.net
        </div>
    </div>
</div>

