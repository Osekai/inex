<?php
$medals = \Data\Medals::GetAll();

$cur_medal = null;
if (isset($args[0])) {
    foreach ($medals->content as $medal) {
        if ($medal['Name'] == $args[0]) {
            $cur_medal = $medal;
        }
    }
}
if ($cur_medal == null) {
    \Site\Embed::$title = "Osekai INEX / Medals";
    \Site\Embed::$description = "osu! medal solutions";
} else {
    \Site\Embed::$title = "Osekai Medals / " . $cur_medal['Name'];
    \Site\Embed::$description = Sanitize::HTML($cur_medal['Description']);
    \Site\Embed::SetImage("/assets/osu/web/" . $cur_medal['Link']);
}
?>
<script>
    const medals_preload = <?= json_encode($medals) ?>;
</script>
<div class="medals__page home" id="medal-page">
    <div class="sidebar">
        <div class="sidebar-toolbar">
            <input type="text" class="input" placeholder="search" id="medal_search">
            <?php
            if (\Database\Session::LoggedIn()) {
                ?>
                <button class="button square" tooltip="Filter Achieved" id="filter-button"><i data-lucide="filter"></i>
                </button>
            <?php } else { ?>
                <a tooltip="Log in to use Filter" href="/login">
                    <button class="button square disabled" tooltip="Log in to use this feature" id="filter-button"><i
                                data-lucide="filter"></i>
                    </button>
                </a>
            <?php } ?>
        </div>

        <div id="no-results" class="sidebar__no-results hidden">
            <img src="/public/img/no_results.png">
            <h1>Can't find that medal!</h1>
        </div>
        <div id="sidebar">

        </div>
    </div>
    <div class="main col-reset" id="main-col">
        <div class="main-inner">
            <div class="bg-outer">
            <div class="bg"></div>
            </div>
            <div class="scrollable">
                <div class="main-left">
                    <div class="mobile medal__info-toolbar">
                        <button id="back" class="button pill-button"><i data-lucide="chevron-left"></i> Back</button>
                    </div>
                    <div class="panel medal__info">
                        <div class="medal__info-upper">
                            <img id="medal_image" src="https://assets.ppy.sh/medals/web/taiko-hits-30000.png">
                            <div class="medal__info-text">
                                <div>
                                    <h1 id="medal_name">Welcome to Osekai Inex!</h1>
                                    <h2 id="medal_description">This is all very heavily WIP</h2>
                                    <h3 id="medal_instructions">Select a medal on your left :3</h3>
                                </div>
                                <?php
                                if (\Data\OsekaiUsers::HasPermission("medal.edit", false)) {
                                    ?>
                                    <div class="button pill-button pill-button-square" id="medal-edit-button"
                                         tooltip="Edit Medal"><i
                                                data-lucide="pencil"></i></div>
                                <?php } ?>
                            </div>
                        </div>
                        <div class="medal__info-solution">
                            <h1>Solution</h1>
                            <p id="medal_solution">Solution</p>
                            <div id="mods"></div>
                        </div>
                    </div>


                    <div class="panel">
                        <div class="panel-header">
                            <h1>Beatmaps</h1>
                            <button id="medal_beatmaps_add" class="button cta pill-button">Add Beatmap</button>
                        </div>
                        <div class="divider"></div>
                        <div id="medal_beatmaps">

                        </div>
                    </div>
                </div>
                <div class="main-right">
                    <div class="panel">
                        <h1>Comments</h1>
                        <div class="divider"></div>
                        <comments-section section="Medals_Data" ref="334" id="comments"></comments-section>
                    </div>
                </div>
            </div>
        </div>
        <div class="main-footer">
            <?php include("./views/elements/footer-inner.php") ?>
        </div>
    </div>
</div>

<div class="medals__unsaved hidden" id="unsaved-medals">
    nope
</div>