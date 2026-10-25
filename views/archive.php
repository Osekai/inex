<?php
$archive = \Data\Archive::GetAll();
$groups = \Data\Archive::GetGroups();

$cur_version = null;
if (isset($args[0])) {
    foreach ($archive->content as $version) {
        if ($version['ID'] == $args[0]) {
            $cur_version = $version;
        }
    }
}
if ($cur_version == null) {
    \Site\Embed::$title = "Osekai Archive";
    \Site\Embed::$description = "archiving osu! versions from 2007 to now";
} else {
    \Site\Embed::$title = "Osekai Archive / " . $cur_version['Version'];
    \Site\Embed::$description = "osu! " . $cur_version['Version'] . ", released " . $cur_version['Release_Date'];
    if ($cur_version['Thumbnail'] != null) {
        \Site\Embed::SetImage($cur_version['Thumbnail']);
    }
}

$can_see_unpublished = \Data\Archive::CanSeeUnpublished();
$can_edit = \Data\OsekaiUsers::HasPermission("snapshots.admin.version.edit")
    || \Data\OsekaiUsers::HasPermission("snapshots.admin.version.screenshots")
    || \Data\OsekaiUsers::HasPermission("snapshots.admin.version.upload")
    || \Data\OsekaiUsers::HasPermission("snapshots.admin.version.publish")
    || \Data\OsekaiUsers::HasPermission("snapshots.admin.version.delete");

$default_group = "";
if (count($groups->content) > 0) {
    $default_group = "group-" . $groups->content[0]['ID'];
}

if(FEATURE_FLAGS['archive'] == false && $can_edit == false) {
    General::Redirect("https://osekai.net/snapshots");
}
?>
<script>
    const archive_preload = <?= json_encode($archive->Return()) ?>;
    const archive_groups_preload = <?= json_encode($groups->Return()) ?>;
    const archive_featured_preload = <?= json_encode(\Data\Archive\Featured::GetActive()->Return()) ?>;
</script>
<div class="archive-outer<?= $cur_version == null ? " home" : "" ?>" otab-container="page" otab-no-replace otab-animate otab-no-history otab-default="<?= $cur_version == null ? "home" : "version" ?>" no-url-replace>
    <div class="archive-sidebar" otab-container="sidebar" otab-no-replace otab-animate otab-default="<?= $default_group ?>">
        <div class="sidebar-md-toolbar">
            <div class="input-container">
                <i data-lucide="search"></i>
                <input type="text" class="input" placeholder="search" id="version_search">
                <button class="hidden" id="version_search_clear"><i data-lucide="x"></i></button>
            </div>
            <button class="button square" id="archive_home" tooltip="Archive Home"><i data-lucide="home"></i></button>
            <?php if (\Database\Session::LoggedIn()) { ?>
                <button class="archive-submit-button" submit-version tooltip="Got a version we don't have? Send it to us!"><i data-lucide="upload"></i> <span>Submit</span></button>
            <?php } else { ?>
                <a class="archive-submit-button" href="/login" tooltip="Log in to submit versions"><i data-lucide="upload"></i> <span>Submit</span></a>
            <?php } ?>
            <?php if ($can_see_unpublished) { ?>
                <a href="/archive/admin" class="button square" tooltip="Archive Admin"><i data-lucide="shield"></i></a>
            <?php } ?>
        </div>
        <div class="archive-sidebar-inner">
            <div class="archive-pages">
                <?php foreach ($groups->content as $group) { ?>
                    <a otab-button="group-<?= $group['ID'] ?>"><?= htmlspecialchars($group['Group_Name']) ?></a>
                <?php } ?>
                <?php if ($can_see_unpublished) { ?>
                    <a otab-button="unpublished">Unpublished</a>
                <?php } ?>
            </div>
            <div class="archive-years" id="archive-years"></div>
            <div class="archive-versions">
                <?php foreach ($groups->content as $group) { ?>
                    <div otab-name="group-<?= $group['ID'] ?>" class="panel" id="sidebar-group-<?= $group['ID'] ?>"></div>
                <?php } ?>
                <?php if ($can_see_unpublished) { ?>
                    <div otab-name="unpublished" class="panel" id="sidebar-unpublished"></div>
                <?php } ?>
            </div>
            <div class="panel archive-search-results">
                <div class="scroll" id="search-results"></div>
            </div>
        </div>
    </div>
    <div class="archive-content" id="main-col">
        <div otab-name="home" class="archive-home">
            <div class="archive-home-welcome">
                <div class="left">
                    <img src="/public/img/branding/app/snapshots.svg" alt="">
                    <h1>Welcome to <strong>Osekai Archive</strong></h1>
                </div>
                <p id="home_subtitle"></p>
            </div>
            <div class="panel archive-home-stats" id="home_stats"></div>
            <div class="archive-featured" id="home_featured"></div>
            <div class="archive-home-columns">
                <div class="archive-home-side">
                    <div class="archive-home-submit">
                        <img src="/public/img/branding/app/snapshots.svg" alt="">
                        <h1>Got an old osu! version?</h1>
                        <p>Help us keep osu!'s history alive. If you've got a version we don't have yet, send it our way!</p>
                        <?php if (\Database\Session::LoggedIn()) { ?>
                            <button class="button cta pill-button" submit-version>Submit a version</button>
                        <?php } else { ?>
                            <a class="button cta pill-button" href="/login">Log in to submit a version</a>
                        <?php } ?>
                    </div>
                    <div class="panel" id="home_popular_panel">
                        <h1><i data-lucide="download"></i> Most Downloaded</h1>
                        <div class="divider"></div>
                        <div class="archive-list" id="home_popular"></div>
                    </div>
                </div>
                <div class="archive-home-main">
                    <div class="panel" id="home_recent_panel">
                        <h1><i data-lucide="clock"></i> Recently Added</h1>
                        <div class="divider"></div>
                        <div class="archive-list" id="home_recent"></div>
                    </div>
                    <div class="panel" id="home_today_panel">
                        <h1><i data-lucide="calendar"></i> On This Day</h1>
                        <div class="divider"></div>
                        <div class="archive-list" id="home_today"></div>
                    </div>
                </div>
            </div>
        </div>
        <div otab-name="version" otab-container="versiontab" otab-no-replace otab-default="info">
            <div class="archive-version-toolbar">
                <button id="back" class="archive-back button pill-button"><i data-lucide="chevron-left"></i> Back</button>
                <?php if ($can_edit) { ?>
                    <div class="archive-version-tabs">
                        <a otab-button="info">Info</a>
                        <a otab-button="edit">Edit</a>
                    </div>
                <?php } ?>
            </div>
            <div otab-name="info" class="archive-version">
                <div class="panel archive-hero" id="version_header">
                    <div class="archive-carousel" id="version_carousel">
                        <div class="archive-carousel-viewport">
                            <div class="archive-carousel-container" id="version_screenshots"></div>
                        </div>
                        <button class="archive-carousel-arrow prev" id="version_carousel_prev"><i data-lucide="chevron-left"></i></button>
                        <button class="archive-carousel-arrow next" id="version_carousel_next"><i data-lucide="chevron-right"></i></button>
                    </div>
                    <div class="archive-carousel-dots" id="version_carousel_dots"></div>
                    <button class="archive-hero-screen" id="version_screen" tooltip="Jump to a screenshot"></button>
                    <div class="archive-hero-title">
                        <div class="archive-hero-name">
                            <h1 id="version_name"></h1>
                            <span class="archive-version-pill" id="version_version"></span>
                        </div>
                        <h3 id="version_release"></h3>
                    </div>
                    <div class="archive-hero-toolbar">
                        <div class="archive-archiver" id="version_archiver"></div>
                        <div class="archive-hero-stats">
                            <p><i data-lucide="eye"></i> <span id="version_views"></span></p>
                            <p><i data-lucide="download"></i> <span id="version_downloads"></span></p>
                        </div>
                        <div id="version_download"></div>
                    </div>
                </div>
                <div class="archive-version-columns">
                    <div class="main-left">
                        <div class="panel">
                            <div class="panel-header">
                                <h1>Comments</h1>
                                <div class="left sort-toggle" id="comments_dropdown">loading</div>
                            </div>
                            <div class="divider"></div>
                            <comments-section dropdown="comments_dropdown" section="Snapshots_Versions" ref="<?= $cur_version == null ? "" : intval($cur_version['ID']) ?>" id="comments"></comments-section>
                        </div>
                    </div>
                    <div class="main-right">
                        <div class="archive-warnings" id="version_warnings"></div>
                        <div class="panel" id="version_description_panel">
                            <div class="panel-header">
                                <h1>Description</h1>
                            </div>
                            <div class="divider"></div>
                            <div class="archive-description" id="version_description"></div>
                        </div>
                        <div class="panel" id="version_changelog_panel">
                            <div class="panel-header">
                                <h1>Changelog</h1>
                                <a id="version_changelog_link" class="button cta pill-button" target="_blank">View on osu!</a>
                            </div>
                            <div class="divider"></div>
                            <div class="archive-description" id="version_changelog"></div>
                            <div class="archive-changelog" id="version_changelog_entries"></div>
                        </div>
                        <div class="panel" id="version_mirrors_outer">
                            <div class="panel-header">
                                <h1>Mirrors</h1>
                            </div>
                            <div class="divider"></div>
                            <div class="archive-mirrors">
                                <div id="version_mirrors"></div>
                            </div>
                        </div>
                        <div class="panel" id="version_video_panel">
                            <div class="panel-header">
                                <h1>Video</h1>
                            </div>
                            <div class="divider"></div>
                            <div class="archive-video" id="version_video"></div>
                        </div>
                    </div>
                </div>
            </div>
            <?php if ($can_edit) { ?>
                <div otab-name="edit" class="archive-editor" id="editor"></div>
            <?php } ?>
        </div>
        <div class="main-footer">
            <?php include("./views/elements/footer-inner.php") ?>
        </div>
    </div>
</div>
