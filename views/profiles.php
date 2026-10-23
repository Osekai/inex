<?php
if (!FEATURE_FLAGS['profiles']) {
    echo "Coming Soon!";
    return;
}

// same request the api would do, the js reads it from the const
$profileResponse = \Data\Profiles::Get($args[0], $args[1] ?? "");
if ($profileResponse->success) {
    $embedUser = $profileResponse->content['User'];

    // username in the url, send them to the id version
    if ((string)$embedUser['id'] !== (string)$args[0]) {
        $redirectUrl = "/profiles/" . intval($embedUser['id']);
        if (!empty($args[1])) {
            $redirectUrl .= "/" . rawurlencode($args[1]);
        }
        header("Location: " . $redirectUrl);
        exit;
    }
    \Site\Embed::SetTitle("Osekai Profiles • " . $embedUser['username']);
    \Site\Embed::SetDescription("Check out the Osekai Profiles page for " . $embedUser['username'] . "! Including stats, medals, goals, timeline, and more!");
    \Site\Embed::SetImage("https://a.ppy.sh/" . intval($embedUser['id']));
    \Site\Embed::AddTags($embedUser['username'] . ",profiles,user_profile");
} else {
    // unknown user, same page as any other 404
    http_response_code(404);
    include("./views/404.php");
    return;
}
?>
<script>
    const profileID = <?= json_encode($args[0]) ?>;
    const gamemode = <?= json_encode($args[1]) ?>;
    const profileResponse = <?= json_encode($profileResponse) ?>;
</script>

<div class="header-img" id="profiles-header-img">

</div>

<div class="profiles-loader" id="profiles-loader">
    <?= LOADER ?>
</div>
<div otab-container="page" otab-no-replace otab-animate otab-default="profile" id="profile-outer" class="hidden" no-url-replace>

    <div class="page-container-inner">
        <warning pr-el="ranking-warning" class="hidden">We're still preparing your profile so a few features may be unavailable, check back in a few minutes!</warning>
        <div class="user-header">
            <img id="user-pfp" pr-el="pfp">
            <div class="name">
                <div>
                    <img id="user-flag" pr-el="flag">
                    <h1 pr-el="username">USERNAME</h1>
                    <div class="groups" pr-el="roles"></div>
                </div>
                <span><i pr-el="gamemode-icon" class="icon-gamemode-osu"></i> #<span pr-el="gamemode-rank">00000</span> Global</span>
            </div>
            <div class="panels">
                <div pr-el="panel-allmode">
                    ALLMODE
                </div>
                <div pr-el="panel-medals" otab-button="medals">
                    MEDALS
                </div>
            </div>
        </div>
        <div class="panel hidden">
        <pre id="json-test" style="width: 100%">

        </pre>
        </div>
    </div>
    <div class="panel hidden">
    </div>
    <div class="page-container-inner main-profile">
        <div class="tabs">
            <p otab-button="profile">
                <i data-lucide="user"></i>
                Profile
            </p>
            <p otab-button="medals">
                <i class="icon-goals-medals"></i>
                Medals
            </p>
            <p otab-button="banners">
                <i data-lucide="image"></i>
                Banners
            </p>
            <gamemode-selector pr-el="gamemode-selector"></gamemode-selector>
            <a pr-el="link-osu" target="_blank" tooltip="View on osu!">
                <i simple-icon="osu"></i>
            </a>
        </div>
        <div class="pages">
            <div otab-name="profile" class="profile-page">
                <div class="left">
                    <div class="panel panel-profile-stats">
                        <h2><i data-lucide="user"></i> Account</h2>
                        <div class="info-rows">
                            <div class="info-row">
                                <p><i data-lucide="calendar"></i> Joined osu!</p>
                                <strong pr-el="osekai-statistics-joined-osu"></strong>
                            </div>
                            <div class="info-row">
                                <p><i class="icon-logo-osekai"></i> Joined Osekai</p>
                                <strong pr-el="osekai-statistics-joined-osekai"></strong>
                            </div>
                        </div>
                        <h2><img src="/public/img/branding/icon_monochrome.svg"> Osekai Contributions</h2>
                        <div class="info-rows">
                            <div class="info-row">
                                <p><i data-lucide="message-circle"></i> Comments</p>
                                <strong pr-el="osekai-statistics-global-comments"></strong>
                            </div>
                        </div>
                        <h2><img src="/public/img/branding/app-fill/medals.svg"> Osekai Medals</h2>
                        <div class="info-rows">
                            <div class="info-row">
                                <p><i data-lucide="map"></i> Beatmap Suggestions</p>
                                <strong pr-el="osekai-statistics-medals-beatmaps"></strong>
                            </div>
                            <div class="info-row">
                                <p><i data-lucide="list-plus"></i> Beatmap Suggestion Upvotes</p>
                                <strong pr-el="osekai-statistics-medals-votes"></strong>
                            </div>
                        </div>
                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <h1>Comments</h1>
                            <div class="left sort-toggle" id="comments_dropdown">loading</div>
                        </div>
                        <div class="divider"></div>
                        <comments-section dropdown="comments_dropdown" section="Profiles_Data" ref="<?= intval($profileResponse->content['User']['id']) ?>"
                                          id="comments" pr-el="comments"></comments-section>
                    </div>
                </div>
                <div class="right">
                    <div class="panel panel-bio" pr-el="panel-bio">
                        <div class="panel-header">
                            <h1>About</h1>
                            <button class="button cta pill-button hidden" pr-el="bio-edit"><i data-lucide="pencil"></i> Edit</button>
                        </div>
                        <div class="divider"></div>
                        <div class="bio-content" pr-el="bio-content"></div>
                        <div class="bio-editor hidden" pr-el="bio-editor"></div>
                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <h1>Timeline</h1>
                        </div>
                        <div class="divider"></div>
                        <div id="timeline-outer"></div>
                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <h1>Goals</h1>
                            <button class="goals-help" id="goals-help" tooltip="What are goals?" style="display: none"><i data-lucide="circle-help"></i></button>
                        </div>
                        <div class="divider"></div>
                        <div id="goals-outer"></div>
                    </div>
                </div>
            </div>
            <div otab-name="medals" pr-el="medals-club-class">
                <div class="medals-top-panel panel">
                    <div class="content">
                        <div class="top">
                            <img pr-el="medals-club-badge">
                            <div>
                                <h1 pr-el="medals-club-name"></h1>
                                <h3>
                                    <span pr-el="medals-total-achieved"></span>/<span
                                            pr-el="medals-total-released"></span>
                                    medals achieved
                                </h3>
                            </div>
                        </div>
                        <div class="ranks" pr-el="medals-ranks">
                            <div>
                                <i data-lucide="globe"></i>
                                Global <span pr-el="medals-global-rank"></span>
                            </div>
                            <div>
                                <img pr-el="flag">
                                Country <span pr-el="medals-country-rank"></span>
                            </div>
                        </div>
                        <div class="bottom">
                            <div class="next-content">
                                <div class="left">
                                    <h4 pr-el="medals-percentage"></h4> Achieved
                                </div>
                                <div class="right" pr-el="medals-club-next">
                                    <h4 pr-el="medals-club-next-togo"></h4> medals until
                                    <img pr-el="medals-club-next-badge">
                                    <span pr-el="medals-club-next-name"></span>
                                </div>
                            </div>
                            <div pr-el="medals-progressbar"></div>
                        </div>
                    </div>
                    <div id="medal-graph"></div>
                </div>
                <div class="medals-favourite">
                    <div class="medals-rarest">
                        <p><i data-lucide="gem"></i> Rarest Medals</p>
                        <div class="medals-rarest-scroller">
                            <div class="medals-rarest-track" pr-el="medals-rarest-list"></div>
                        </div>
                    </div>
                    <div class="medals-favourite-outer" pr-el="medal-favourite"></div>
                </div>
                <div class="medals-lower">
                    <div class="panel">
                        <h1>Medal History</h1>
                        <div class="divider"></div>
                        <div id="medal-history-outer"></div>
                    </div>
                    <div class="panel medals-unachieved">
                        <div class="panel-header">
                            <h1>Medals to Achieve</h1>
                            <searchable-dropdown id="unachieved-sort"></searchable-dropdown>
                        </div>
                        <div class="divider"></div>
                        <div id="medals-unachieved-outer"></div>
                    </div>
                </div>
            </div>
            <div otab-name="banners" id="banners-outer">
            </div>
        </div>
    </div>

</div>
<?php
include("./views/elements/footer.php");
?>
