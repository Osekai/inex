<?php

use Database\Session;

if (INSTANCE !== "dev") {
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

<div class="profiles-home" no-url-replace>
    <div>
        <div class="header" style="width: 50vw; max-width: 600px;">
            <img src="/public/img/branding/app/profiles.svg">
            <h1>Welcome to Osekai Profiles Beta</h1>
        </div>
        <form action="/profiles/">
            <input class="input" type="text" name="username" placeholder="Username or ID">
            <button class="button">Visit Profile</button>
        </form>
        <div class="or">Or</div>
        <?php
        if (\Database\Session::LoggedIn()) {
            ?>

            <a href="/profiles/<?= Session::UserData()['id'] ?>" class="youpanel">
                <img src="https://a.ppy.sh/<?= Session::UserData()['id'] ?>">
                <div>
                    <h3><?= Session::UserData()['username'] ?></h3>
                    <small><?= Session::UserData()['id'] ?></small>

                    <p>Visit Your Profile</p>
                </div>
            </a>
            <?php
        } else {
            ?>
            <a href="/login">Log in to view & edit your profile</a>
            <?php
        }
        ?>
    </div>
    <div>
        <div class="panel">
            <h1>Known Issues</h1>
            <div class="divider"></div>
            <ul class="markdown" style="margin-left: 15px;">
                <li>Custom banner URLs are not yet viewable and instead just hit a 404. This will be fixed for
                    release.
                </li>
                <li><strong>Mobile is completely non-functional and most page layouts will reak</strong></li>
                <li>osu! page link is missing (and/or loops back to Osekai by accident)</li>
                <li>Some links get redirected to osu! instead of Osekai by accident depending on user settings</li>
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
        <br>

        <h3>Any problems? Report them in the inex channel on Discord</h3>
    </div>
</div>

<?php
include("./views/elements/footer.php");
?>
