<?php
$user = $qu['User'];
$medalStats = $qu['Statistics']['Medals'];

// rarest = lowest frequency out of the ones they have
$rarest = null;
foreach ($qu['Medals'] as $medal) {
    if (!$medal['Obtained']) continue;
    if ($rarest === null || $medal['Frequency'] < $rarest['Frequency']) {
        $rarest = $medal;
    }
}

$num = function ($value, $decimals = 0) {
    if ($value === null) return "-";
    return number_format($value, $decimals);
};
?>
<div class="bg-elements">
    <?php if ($rarest !== null) { ?>
        <medal-icon src="<?= str_replace(".png", "", $rarest['Link']) ?>"></medal-icon>
    <?php } ?>
</div>
<div class="scoreboard">
    <div class="darken-layer"></div>
    <pb-pfp></pb-pfp>
    <div class="main">
        <div class="head">
            <div class="who">
                <h1><?= htmlspecialchars($user['username']) ?></h1>
                <p class="sub"><span id="clubname"></span> <span class="sep">/</span> <?= htmlspecialchars($user['country_code'] ?? "") ?> #<?= $num($medalStats['Ranks']['Country'] ?? null) ?></p>
            </div>
            <div class="rank">
                <p class="label">medal rank</p>
                <p class="big"><span>#</span><?= $num($medalStats['Ranks']['Global'] ?? null) ?></p>
            </div>
        </div>
        <div class="foot">
            <div class="cells">
                <div>
                    <p class="label">medals</p>
                    <p class="val"><?= $num($medalStats['TotalAchieved']) ?>/<?= $num($medalStats['TotalReleased']) ?></p>
                </div>
                <div>
                    <p class="label">completion</p>
                    <p class="val"><?= $num($medalStats['Percentage'], 2) ?>%</p>
                </div>
            </div>
            <?php if ($rarest !== null) { ?>
                <div class="rarest">
                    <medal-icon src="<?= str_replace(".png", "", $rarest['Link']) ?>"></medal-icon>
                    <p><?= htmlspecialchars($rarest['Name']) ?> <span><?= $num($rarest['Frequency'] * 100, 4) ?>%</span></p>
                </div>
            <?php } ?>
        </div>
    </div>
</div>
<div class="watermark">
    <img src="/public/img/branding/app/profiles.svg">
    <p>Osekai Profiles <span>osekai.net</span></p>
</div>
