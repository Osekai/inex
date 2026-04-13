<?php
if($args[0] == null) {
    \Site\Embed::SetTitle("Osekai Badges");
    \Site\Embed::SetDescription("view (almost) all of osu!'s badges");
} else {
    $badge = \Data\Badges::GetOne($args[0]);
    $userCount = count($badge['Users']);
    $date = date("F j, Y", strtotime($badge['First_Date_Awarded']));

    $previewNames = array_slice(array_column($badge['Users'], 'Username'), 0, 3);
    $previewStr = implode(", ", $previewNames);
    if ($userCount > 3) $previewStr .= ", +" . ($userCount - 3) . " more";

    \Site\Embed::SetTitle("Osekai Badges / " . $badge['Description']);
    \Site\Embed::SetDescription(
            "First awarded " . $date . "\n" .
            $userCount . " " . ($userCount === 1 ? "player" : "players") . ": " . $previewStr
    );
    \Site\Embed::SetBannerImage($badge['Image_URL']);
}
?>
<div class="badges__outer">
    <div class="list__area">
        <div class="list__bar-outer">
            <div class="list__bar">
                <div>
                    <searchable-dropdown id="sort-dropdown"></searchable-dropdown>
                    <button id="ascend-button" class="button square">

                    </button>
                </div>
                <input type="text" class="input" placeholder="Search Badges" id="badge_search">
                <div id="display_toggle" class="badges__display-toggles">

                </div>
            </div>
        </div>
        <div id="spacer" class="">
            <div id="grid-loader"><?= LOADER ?></div>
            <div id="grid" class="padding badges__grid"></div>
        </div>
    </div>
    <div class="badges__sidebar-close-area" id="close-sidebar-2"></div>
    <div class="badges__sidebar" id="badge-sidebar">
        <div class="badges__sidebar-inner">
            <div class="badges__sidebar_toolbar">
                <button class="button icon-button" id="close-sidebar">
                    <i data-lucide="chevron-left"></i>
                    Close
                </button>
            </div>
            <div class="padding info">
                <div class="top">
                    <img src="" id="badge-img">
                    <div class="size-1x">
                        <img src="" id="badge-img-1x">
                        <p>1x</p>
                    </div>
                </div>
                <div class="floater">
                    <code id="badge-name-real">name-name</code>
                    <h1 id="badge-description">Name</h1>
                </div>
                <div>
                    <h2><strong id="badge-users">24</strong> users</h2>
                    <h3>first achieved <strong id="badge-achieved">2 years ago</strong></h3>
                </div>
            </div>
            <div class="divider"></div>
            <div class="padding">
                <h1>Users</h1>
                <div id="badge-users-list" class="users-list">

                </div>
            </div>
        </div>
    </div>
</div>
