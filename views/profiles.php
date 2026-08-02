<?php
if (INSTANCE !== "dev") {
    // we're off for now
    header("Location: https://osekai.net/profiles?user=" . $args[0]);
    exit;
}
?>
<script>
    const profileID = <?= json_encode($args[0]) ?>;
    const gamemode = <?= json_encode($args[1]) ?>;
</script>

<div class="header-img" id="profiles-header-img">

</div>

<div otab-container="page" otab-no-replace otab-default="profile" id="profile-outer">

    <div class="page-container-inner">
        <div class="user-header">
            <img id="user-pfp" pr-el="pfp">
            <div class="name">
                <div>
                    <img id="user-flag" pr-el="flag">
                    <h1 pr-el="username">USERNAME</h1>
                </div>
                <span><i pr-el="gamemode-icon" class="icon-gamemode-osu"></i> #<span pr-el="gamemode-rank">00000</span> Global</span>
            </div>
            <div class="panels">
                <div pr-el="panel-allmode" otab-button="allmode">
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
            <p otab-button="profile">Profile</p>
            <p otab-button="medals">Medals</p>
            <p otab-button="banners">Banners</p>
            <p otab-button="allmode">Allmode</p>
            <a pr-el="link-osu" target="_blank">
                <i class="icon-logo-osu"></i>
            </a>
        </div>
        <div class="pages">
            <div otab-name="profile">
                <div class="left">
                    <div class="panel">
                        <h1>Info</h1>
                        <p>Joined osu! <strong pr-el="stats-osu-join-date"></strong></p>
                        <p>Joined Osekai <strong pr-el="stats-osekai-join-date"></strong></p>
                        <h1>Contributions</h1>
                        <p>
                            <i data-lucide="message-circle"></i>
                            <strong pr-el="stats-comments"></strong> comments
                        </p>
                        <h3><img src="/public/img/branding/app/medals.svg"> Medals</h3>
                        <p>
                            <i data-lucide="map"></i>
                            <strong pr-el="stats-medals-beatmaps"></strong> beatmaps
                        </p>
                        <p>
                            <i data-lucide="list-plus"></i>
                            <strong pr-el="stats-medals-upvotes"></strong> beatmap upvotes
                        </p>

                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <h1>Comments</h1>
                            <div class="left sort-toggle" id="comments_dropdown">loading</div>
                        </div>
                        <div class="divider"></div>
                        <comments-section dropdown="comments_dropdown" section="Profiles_Data" ref="334"
                                          id="comments" pr-el="comments"></comments-section>
                    </div>
                </div>
                <div class="right">

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
                        <div class="ranks">
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
                                <div class="right">
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
                    <a class="medal-item" pr-el="medal-rarest-link">
                        <medal-icon pr-el="medal-rarest-icon"></medal-icon>
                        <div>
                            <p><i data-lucide="gem"></i> Rarest Medal</p>
                            <h1 pr-el="medal-rarest-name"></h1>
                            <div>
                                <h4>Achieved <span pr-el="medal-rarest-achieved-date"></span></h4>
                                /
                                <h4><span pr-el="medal-rarest-percentage"></span>% of users have this medal!</h4>
                            </div>
                        </div>
                    </a>
                    <a class="medal-item" pr-el="medal-favourite-link">
                        <medal-icon pr-el="medal-favourite-icon"></medal-icon>
                        <div>
                            <p><i data-lucide="star"></i> Favourite Medal</p>
                            <h1 pr-el="medal-favourite-name"></h1>
                        </div>
                        <button pr-el="medal-favourite-button" class="button">
                            <i data-lucide="star"></i>
                            Change your Favourite Medal
                        </button>
                    </a>
                </div>
            </div>
            <div otab-name="banners">
                <p>banners</p>
            </div>
            <div otab-name="allmode">
                <p>allmode</p>
            </div>
        </div>
    </div>

</div>