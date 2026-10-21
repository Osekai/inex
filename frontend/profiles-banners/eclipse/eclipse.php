<?php
// rarest = lowest frequency out of the ones they have
$rarest = null;
foreach ($qu['Medals'] as $medal) {
    if (!$medal['Obtained']) continue;
    if ($rarest === null || $medal['Frequency'] < $rarest['Frequency']) {
        $rarest = $medal;
    }
}
?>
<div class="bg-elements">
    <pb-gamemode-icon></pb-gamemode-icon>
</div>
<div class="content-inner">
    <pb-pfp></pb-pfp>
    <div>
        <div class="top-stats">
            <h1><?= $qu['User']['username'] ?></h1>
            <h3><span id="clubname"></span> with <span><?= $qu['Statistics']['Medals']['TotalAchieved'] ?></span> medals</h3>
        </div>
        <pb-medals-completion-bar></pb-medals-completion-bar>
        <div class="bottom-stats">
            <div class="stat-pills">
                <div>
                    <div><p>PP</p></div>
                    <p><?= $qu['User']['statistics']['pp'] ?></p>
                </div>
                <div>
                    <div><pb-gamemode-icon></pb-gamemode-icon></div>
                    <p>#<?= $qu['User']['statistics']['global_rank'] ?></p>
                </div>
                <?php if ($rarest !== null) { ?>
                    <div>
                        <div><p>Rarest Medal</p></div>
                        <medal-icon src="<?= str_replace(".png", "", $rarest['Link']) ?>"></medal-icon>
                        <p><?= htmlspecialchars($rarest['Name']) ?> <span class="rarity"><?= round($rarest['Frequency'] * 100, 2) ?>%</span></p>
                    </div>
                <?php } ?>
            </div>
            <div>
                <p class="medalrank">Medal Rank <strong>#<?= $qu['Statistics']['Medals']['Ranks']['Global'] ?></strong></p>
            </div>
        </div>
    </div>
</div>
<div class="watermark">
    <div>
        <img src="/public/img/branding/app/profiles.svg">
        <p>Osekai Profiles</p>
    </div>
    <div>
        https://osekai.net
    </div>
</div>
