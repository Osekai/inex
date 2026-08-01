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
    \Site\Embed::SetImage("/assets/medals/web/" . $cur_medal['Link']);
}
?>
<script>
    const medals_preload = <?= json_encode($medals) ?>;
</script>
<div class="medals__loader">
    <?= LOADER ?>
</div>
<div class="medals__page home" id="medal-page">
    <div class="sidebar">
        <div class="sidebar-md-toolbar">
            <div class="input-container">
                <i data-lucide="search"></i>
                <input type="text" class="input" placeholder="search" id="medal_search" bug="medals/search">
                <button class="hidden" id="medal_search_clear"><i data-lucide="x"></i></button>
            </div>
            <?php
            if (\Database\Session::LoggedIn()) {
                ?>
                <button class="button square" tooltip="Mark Completed Medals" id="filter-button"
                        bug="medals/search_filter"><i
                            data-lucide="filter"></i>
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
            <div class="homepage" id="medal-home">
                <div class="hp-navbar">
                    <img src="/public/img/branding/app-fill/medals.svg">
                    <h1>Welcome back to Osekai Medals<?php
                        if (\Database\Session::LoggedIn()) {
                            echo ", " . \Database\Session::UserData()['username'];
                        }
                        ?>!
                    </h1>
                </div>
                <?php
                $new = [];
                $oneMonthAgo = strtotime('-1 month');
                foreach ($medals->content as $medal) {
                    if (strtotime($medal['Date_Released']) >= $oneMonthAgo) {
                        $new[] = $medal;
                    }
                }
                if ($new !== []) {
                    ?>
                    <div class="homepage-panel" bug="medals/home/new">
                        <h1>New Medals are here!</h1>
                        <div class="medals-grid">
                            <?php
                            foreach ($new as $medal) {
                                ?>
                                <a class="medal-card" medal-button="<?= $medal['Medal_ID'] ?>">
                                    <img src="/assets/medals/web/<?= $medal['Link'] ?>">
                                    <h1><?= $medal['Name'] ?></h1>
                                    <h2><?= $medal['Description'] ?></h2>
                                </a>
                            <?php } ?>
                        </div>
                    </div>
                    <?php
                }
                ?>
                <div class="homepage-panel" bug="medals/home/suggestions">
                    <h1>Our recommendations for you</h1>
                    <div class="recommendations-grid" id="recommendations-grid">
                        <?= LOADER ?>
                    </div>
                </div>
            </div>
            <div class="scrollable _hidden" id="medal-info">
                <div class="mobile medal__info-toolbar">
                    <button id="back" class="button pill-button"><i data-lucide="chevron-left"></i> Back</button>
                </div>
                <div class="main-left">
                    <div class="panel medal__info">
                        <div class="medal__info-upper" bug="medals/info/info">
                            <medal-icon id="medal_image" src="all-secret-jackpot"></medal-icon>
                            <div class="medal__info-text">
                                <div>
                                    <h1>
                                        <div id="medal_obtained">
                                            <i data-lucide="check"></i>
                                        </div>
                                        <span id="medal_name"></span>
                                    </h1>
                                    <h2 id="medal_description"></h2>
                                    <h3 id="medal_instructions"></h3>
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
                        <div class="medal__info-solution" bug="medals/info/solution">
                            <h1>Solution</h1>
                            <p id="medal_solution">Solution</p>
                            <div class="md-toolbar">
                                <div id="mods"></div>
                                <div id="support">
                                    <div class="support-pill" id="support-stable">
                                        <div icon></div>
                                        <p>Stable</p>
                                    </div>
                                    <div class="support-pill" id="support-lazer">
                                        <div icon></div>
                                        <p>Lazer</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div class="panel" id="medal_beatmaps_panel" bug="medals/info/beatmaps">
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
                        <div class="loader-overlay" id="extra-loader">
                            <?= LOADER ?>
                        </div>
                        <div class="panel-header">
                            <h1>Extra Info</h1>
                        </div>
                        <div class="divider"></div>
                        <div class="medal__extra-info col-reset">
                            <div bug="medals/info/stats/release" extra-info-panel="release">
                                <div class="header">
                                    <h3>Release Date</h3>
                                    <button selector="collapse">
                                        <i data-lucide="chevron-down"></i>
                                    </button>
                                </div>
                                <div class="inner">
                                    <h1 id="medal_release_date"></h1>
                                    <h2 id="medal_release_date_ago"></h2>
                                </div>
                            </div>
                            <div class="fab" bug="medals/info/stats/first_achieved" extra-info-panel="first">
                                <div class="header">
                                    <h3>First Achieved By</h3>
                                    <button selector="collapse">
                                        <i data-lucide="chevron-down"></i>
                                    </button>
                                </div>
                                <a target="_blank" id="medal_first_achieved_by_link" class="inner">
                                    <img id="medal_first_achieved_by_pfp">
                                    <h1 id="medal_first_achieved_by"></h1>
                                    <h2 id="medal_first_achieved_date"></h2>
                                </a>
                            </div>
                            <div bug="medals/info/stats/adoption" extra-info-panel="adoption">
                                <div class="header">
                                    <h3>Medal Adoption</h3>
                                    <p><span id="medal_adoption_users"></span> users</p>
                                    <button selector="collapse">
                                        <i data-lucide="chevron-down"></i>
                                    </button>
                                </div>
                                <div class="inner" id="medal_adoption_graph">

                                </div>
                            </div>
                            <div bug="medals/info/stats/users" extra-info-panel="users" class="collapsed">
                                <div class="header">
                                    <h3>Medal Owners</h3>
                                    <button selector="collapse">
                                        <i data-lucide="chevron-down"></i>
                                    </button>
                                </div>
                                <div class="inner extrainfo-playerlist">
                                    <div class="info">
                                        <p>
                                            This list contains <span id="medal_users_real_total"></span> out of <span
                                                    id="medal_users_osu_total"></span> users who has this medal.
                                        </p>
                                        <div tooltip="Osekai can only track the data of so many users without processing times going through the roof. Beacuse of this, we can't always show every user which has a medal.">

                                            <i data-lucide="info"></i>
                                        </div>
                                    </div>
                                    <div class="list" id="medal_users_list">

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <h1>Comments</h1>
                            <div class="left sort-toggle" id="comments_dropdown">loading</div>
                        </div>
                        <div class="divider"></div>
                        <comments-section dropdown="comments_dropdown" section="Medals_Data" ref="334"
                                          id="comments"></comments-section>
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