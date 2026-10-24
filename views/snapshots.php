<?php
$snapshots = \Data\Snapshots::GetAll();
$groups = \Data\Snapshots::GetGroups();

$cur_version = null;
if (isset($args[0])) {
    foreach ($snapshots->content as $version) {
        if ($version['ID'] == $args[0]) {
            $cur_version = $version;
        }
    }
}
if ($cur_version == null) {
    \Site\Embed::$title = "Osekai Snapshots";
    \Site\Embed::$description = "archiving osu! versions from 2007 to now";
} else {
    \Site\Embed::$title = "Osekai Snapshots / " . $cur_version['Version'];
    \Site\Embed::$description = "osu! " . $cur_version['Version'] . ", released " . $cur_version['Release_Date'];
    if ($cur_version['Thumbnail'] != null) {
        \Site\Embed::SetImage($cur_version['Thumbnail']);
    }
}

$can_see_unpublished = \Data\Snapshots::CanSeeUnpublished();
$can_edit = \Data\OsekaiUsers::HasPermission("snapshots.admin.version.edit")
    || \Data\OsekaiUsers::HasPermission("snapshots.admin.version.screenshots")
    || \Data\OsekaiUsers::HasPermission("snapshots.admin.version.upload")
    || \Data\OsekaiUsers::HasPermission("snapshots.admin.version.publish")
    || \Data\OsekaiUsers::HasPermission("snapshots.admin.version.delete");

$default_group = "";
if (count($groups->content) > 0) {
    $default_group = "group-" . $groups->content[0]['ID'];
}

if(FEATURE_FLAGS['snapshots'] == false && $can_edit == false) {
    General::Redirect("https://osekai.net/snapshots");
}
?>
<script>
    const snapshots_preload = <?= json_encode($snapshots->Return()) ?>;
    const snapshots_groups_preload = <?= json_encode($groups->Return()) ?>;
</script>
<div class="snapshots-outer<?= $cur_version == null ? " home" : "" ?>" otab-container="page" otab-no-replace otab-animate otab-no-history otab-default="<?= $cur_version == null ? "home" : "version" ?>" no-url-replace>
    <div class="snapshots-sidebar" otab-container="sidebar" otab-no-replace otab-animate otab-default="<?= $default_group ?>">
        <div class="sidebar-md-toolbar">
            <div class="input-container">
                <i data-lucide="search"></i>
                <input type="text" class="input" placeholder="search" id="version_search">
                <button class="hidden" id="version_search_clear"><i data-lucide="x"></i></button>
            </div>
            <button class="button square" id="snapshots_home" tooltip="Snapshots Home"><i data-lucide="home"></i></button>
            <?php if (\Database\Session::LoggedIn()) { ?>
                <button class="snapshots-submit-button" submit-version tooltip="Got a version we don't have? Send it to us!"><i data-lucide="upload"></i> <span>Submit</span></button>
            <?php } else { ?>
                <a class="snapshots-submit-button" href="/login" tooltip="Log in to submit versions"><i data-lucide="upload"></i> <span>Submit</span></a>
            <?php } ?>
            <?php if ($can_see_unpublished) { ?>
                <a href="/snapshots/admin" class="button square" tooltip="Snapshots Admin"><i data-lucide="shield"></i></a>
            <?php } ?>
        </div>
        <div class="snapshots-sidebar-inner">
            <div class="snapshots-pages">
                <?php foreach ($groups->content as $group) { ?>
                    <a otab-button="group-<?= $group['ID'] ?>"><?= htmlspecialchars($group['Group_Name']) ?></a>
                <?php } ?>
                <?php if ($can_see_unpublished) { ?>
                    <a otab-button="unpublished">Unpublished</a>
                <?php } ?>
            </div>
            <div class="snapshots-years" id="snapshots-years"></div>
            <div class="snapshots-versions">
                <?php foreach ($groups->content as $group) { ?>
                    <div otab-name="group-<?= $group['ID'] ?>" class="panel" id="sidebar-group-<?= $group['ID'] ?>"></div>
                <?php } ?>
                <?php if ($can_see_unpublished) { ?>
                    <div otab-name="unpublished" class="panel" id="sidebar-unpublished"></div>
                <?php } ?>
            </div>
            <div class="panel snapshots-search-results">
                <div class="scroll" id="search-results"></div>
            </div>
        </div>
    </div>
    <div class="snapshots-content" id="main-col">
        <div otab-name="home" class="snapshots-home">
            <div class="panel">
                <h1>Welcome to Osekai Snapshots</h1>
                <div class="divider"></div>
                <p>archiving <strong><?= count($snapshots->content) ?></strong> osu! versions from 2007 to now</p>
                <div class="snapshots-home-buttons">
                    <?php if (\Database\Session::LoggedIn()) { ?>
                        <button class="lumen-button" submit-version><i data-lucide="upload"></i> Submit a version</button>
                    <?php } else { ?>
                        <a class="lumen-button" href="/login" tooltip="Log in to submit versions"><i data-lucide="upload"></i> Submit a version</a>
                    <?php } ?>
                </div>
            </div>
        </div>
        <div otab-name="version" otab-container="versiontab" otab-no-replace otab-default="info">
            <div class="snapshots-version-toolbar">
                <button id="back" class="snapshots-back button pill-button"><i data-lucide="chevron-left"></i> Back</button>
                <?php if ($can_edit) { ?>
                    <div class="snapshots-version-tabs">
                        <a otab-button="info">Info</a>
                        <a otab-button="edit">Edit</a>
                    </div>
                <?php } ?>
            </div>
            <div otab-name="info" class="snapshots-version">
                <div class="panel snapshots-hero" id="version_header">
                    <div class="snapshots-carousel" id="version_carousel">
                        <div class="snapshots-carousel-viewport">
                            <div class="snapshots-carousel-container" id="version_screenshots"></div>
                        </div>
                        <button class="snapshots-carousel-arrow prev" id="version_carousel_prev"><i data-lucide="chevron-left"></i></button>
                        <button class="snapshots-carousel-arrow next" id="version_carousel_next"><i data-lucide="chevron-right"></i></button>
                    </div>
                    <div class="snapshots-carousel-dots" id="version_carousel_dots"></div>
                    <button class="snapshots-hero-screen" id="version_screen" tooltip="Jump to a screenshot"></button>
                    <div class="snapshots-hero-title">
                        <div class="snapshots-hero-name">
                            <h1 id="version_name"></h1>
                            <span class="snapshots-version-pill" id="version_version"></span>
                        </div>
                        <h3 id="version_release"></h3>
                    </div>
                    <div class="snapshots-hero-toolbar">
                        <div class="snapshots-archiver" id="version_archiver"></div>
                        <div class="snapshots-hero-stats">
                            <p><i data-lucide="eye"></i> <span id="version_views"></span></p>
                            <p><i data-lucide="download"></i> <span id="version_downloads"></span></p>
                        </div>
                        <div id="version_download"></div>
                    </div>
                </div>
                <div class="snapshots-version-columns">
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
                        <div class="snapshots-warnings" id="version_warnings"></div>
                        <div class="panel" id="version_description_panel">
                            <div class="panel-header">
                                <h1>Description</h1>
                            </div>
                            <div class="divider"></div>
                            <div class="snapshots-description" id="version_description"></div>
                        </div>
                        <div class="panel" id="version_mirrors_outer">
                            <div class="panel-header">
                                <h1>Mirrors</h1>
                            </div>
                            <div class="divider"></div>
                            <div class="snapshots-mirrors">
                                <div id="version_mirrors"></div>
                            </div>
                        </div>
                        <div class="panel" id="version_video_panel">
                            <div class="panel-header">
                                <h1>Video</h1>
                            </div>
                            <div class="divider"></div>
                            <div class="snapshots-video" id="version_video"></div>
                        </div>
                    </div>
                </div>
            </div>
            <?php if ($can_edit) { ?>
                <div otab-name="edit" class="snapshots-editor" id="editor"></div>
            <?php } ?>
        </div>
        <div class="main-footer">
            <?php include("./views/elements/footer-inner.php") ?>
        </div>
    </div>
</div>
