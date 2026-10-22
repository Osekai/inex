<?php

use Site\Embed;

Embed::SetTitle("Medals required for Retro Achiever");
Embed::SetDescription('A list of every medal required for the "Retro Achiever" medal on the osu! Medal Hunters Discord server!');

// ported from eclipse: omh/retro_achiever
$retroMedals = [
    "Video Game Pack vol.1",
    "Video Game Pack vol.2",
    "Video Game Pack vol.3",
    "Video Game Pack vol.4",
    "Anime Pack vol.1",
    "Anime Pack vol.2",
    "Anime Pack vol.3",
    "Anime Pack vol.4",
    "Internet! Pack vol.1",
    "Internet! Pack vol.2",
    "Internet! Pack vol.3",
    "Internet! Pack vol.4",
    "Rhythm Game Pack vol.1",
    "Rhythm Game Pack vol.2",
    "Rhythm Game Pack vol.3",
    "Rhythm Game Pack vol.4",
    "500 Combo",
    "750 Combo",
    "1,000 Combo",
    "2,000 Combo",
    "5,000 Plays",
    "15,000 Plays",
    "25,000 Plays",
    "50,000 Plays",
    "Catch 20,000 fruits",
    "Catch 200,000 fruits",
    "Catch 2,000,000 fruits",
    "30,000 Drum Hits",
    "300,000 Drum Hits",
    "3,000,000 Drum Hits",
    "40,000 Keys",
    "400,000 Keys",
    "4,000,000 Keys",
    "Don't let the bunny distract you!",
    "S-Ranker",
    "Most Improved",
    "Non-stop Dancer",
    "Consolation Prize",
    "Challenge Accepted",
    "Stumbler",
    "Jackpot",
    "Quick Draw",
    "Obsessed",
    "Nonstop",
    "Jack of All Trades",
];

$medals = \Data\Medals::GetAll()->content;

// same order as eclipse (grouping desc, then ordering)
usort($medals, function ($a, $b) {
    $grouping = strcmp($b['Grouping'] ?? "", $a['Grouping'] ?? "");
    if ($grouping != 0) {
        return $grouping;
    }
    return ($a['Ordering'] ?? 0) <=> ($b['Ordering'] ?? 0);
});
?>
<div class="retro-achiever">
    <div class="main">
        <div class="main-left">
            <div class="main-left-title">
                <p>Medals required for</p>
                <h1>Retro Achiever</h1>
            </div>
            <div class="main-medals-list">
                <?php
                foreach ($medals as $medal) {
                    if (in_array($medal['Name'], $retroMedals)) {
                        ?>
                        <a class="main-medal" href="/medals/<?= rawurlencode($medal['Name']) ?>">
                            <medal-icon src="<?= htmlspecialchars($medal['Link']) ?>"></medal-icon>
                            <p><?= htmlspecialchars($medal['Name']) ?></p>
                        </a>
                        <?php
                    }
                }
                ?>
            </div>
        </div>
        <div class="main-right">
            <img src="/public/img/retro_achiever/retro-achiever-panel-centered.png">
        </div>
    </div>
</div>
