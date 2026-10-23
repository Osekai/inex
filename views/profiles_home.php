<?php

use Database\Session;

if (!FEATURE_FLAGS['profiles']) {
    // we're off for now
    header("Location: https://osekai.net/profiles");
    exit;
}
if (isset($_GET['username'])) {
    $user = \API\Osu\User::GetUser($_GET['username']);
    header("Location: /profiles/" . $user['id']);
}

\Site\Embed::SetTitle("Osekai Profiles");
\Site\Embed::SetDescription("Check out Osekai Profiles! Featuring stats, medals, goals, timeline, and more, for every single osu! user!");
\Site\Embed::AddTags("profiles,user_profile,badges,graph,chart,goals");
?>

<div class="page-container-inner profiles-home" no-url-replace>
    <div class="profiles-home-side">
        <div class="welcomepanel">
            <img src="/public/img/branding/app/profiles.svg">
            <h2>Welcome to</h2>
            <h1>Osekai Profiles!</h1>
            <p>Stats, medals, goals, a timeline and more, for every osu! player. Currently in beta!</p>
        </div>

        <?php
        if (\Database\Session::LoggedIn()) {
            $you = Session::UserData();
            ?>
            <a href="/profiles/<?= intval($you['id']) ?>" class="your-profile">
                <img src="https://a.ppy.sh/<?= intval($you['id']) ?>">
                <div class="texts">
                    <p>Your Profile</p>
                    <h1><?= htmlspecialchars($you['username']) ?></h1>
                </div>
            </a>
            <?php
        } else {
            ?>
            <a href="/login" class="your-profile">
                <div class="texts">
                    <p>Not logged in</p>
                    <h1>Log in to view &amp; edit your profile</h1>
                </div>
            </a>
            <?php
        }
        ?>

        <div class="panel panel-search">
            <h1>Find a Profile</h1>
            <div class="divider"></div>
            <div class="profile-search">
                <form action="/profiles/" autocomplete="off">
                    <input class="input" type="text" name="username" placeholder="Search for a user..." pr-el="search-input">
                </form>
                <div class="profile-search-results hidden" pr-el="search-results"></div>
            </div>
        </div>

        <div class="panel">
            <h1><i data-lucide="eye"></i> Most Viewed</h1>
            <div class="divider"></div>
            <div class="profile-list" pr-el="most-viewed"></div>
        </div>
        <?php if (\Database\Session::LoggedIn()) { ?>
            <div class="panel">
                <h1><i data-lucide="history"></i> Recently Viewed</h1>
                <div class="divider"></div>
                <div class="profile-list" pr-el="recently-viewed"></div>
            </div>
        <?php } ?>
    </div>
    <div class="profiles-home-main">
        <div class="panel panel-leaderboard">
            <div class="panel-header">
                <h1><i data-lucide="chart-line"></i> Leaderboard</h1>
                <gamemode-selector value="osu" allow-all pr-el="leaderboard-mode"></gamemode-selector>
            </div>
            <div class="divider"></div>
            <div class="leaderboard-tabs">
                <button class="pill-button active" pr-el="leaderboard-tab" leaderboard-type="pp">Performance</button>
                <button class="pill-button" pr-el="leaderboard-tab" leaderboard-type="medals">Medals</button>
            </div>
            <div class="profile-list leaderboard" pr-el="leaderboard"></div>
        </div>
        <div class="panel">
            <h1>Known Issues</h1>
            <div class="divider"></div>
            <ul class="markdown" style="margin-left: 15px;">
                <li>Custom banner URLs are not yet viewable and instead just hit a 404. This will be fixed for
                    release.
                </li>
                <li>Embeds when sending on Discord are blank (show as 404)</li>
            </ul>
        </div>
        <div class="panel">
            <h1>Intentional Changes</h1>
            <div class="divider"></div>
            <ul class="markdown" style="margin-left: 15px;">
                <li>Generic data such as rank graph, rank info, and other user data from osu! is intentionally
                    ommitted
                </li>
            </ul>
        </div>
        <h3>Any problems? Report them in the inex channel on Discord</h3>
    </div>
</div>

<?php
include("./views/elements/footer.php");
?>
