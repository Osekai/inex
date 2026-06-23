<?php
if(INSTANCE !== "dev") {
    echo "<script>window.location.href = 'https://osekai.net/profiles?user=".$args[0]."';</script>";
    exit;
}
?>
<script>
    const profileID = <?= json_encode($args[0]) ?>
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
        <div id="medal-graph"></div>
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
                <p>profile</p>
            </div>
            <div otab-name="medals">
                <p>medals</p>
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