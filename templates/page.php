<?php

$nav = [
        '/' => ['label' => 'home', 'icon' => '/public/img/branding/app/home.svg'],
        '/medals' => ['label' => 'medals', 'icon' => '/public/img/branding/app/medals.svg'],
        '/badges' => ['label' => 'badges', 'icon' => '/public/img/branding/app/badges.svg'],
        '/rankings' => ['label' => 'rankings', 'icon' => '/public/img/branding/app/rankings.svg'],
        'https://osekai.net/profiles' => ['label' => 'profiles', 'icon' => '/public/img/branding/app/profiles.svg'],
];

$current = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/') ?: '/';

foreach ($nav as $url => $item) {
    $active = $url === '/' ? $current === '/' : str_starts_with($current, $url);
    if ($active) {
        $nav[$url]['active'] = true;
        $nav[$url]['icon'] = str_replace('app', 'app-fill', $item['icon']);
    }
}


$unreadNotifs=  0;
if(\Database\Session::LoggedIn()) {
    $unreadNotifs = Data\Notifications\Utils::UnreadCount();
}

use Database\Session; ?>

<div class="navbar" bug="navbar" bug-name="Navbar">
    <a class="skip-link" href='#main'>Skip to content</a>
    <div class="navbar-upper">
        <div class="navbar-left">
            <a href="/">
                <img src="/public/img/branding/icon_monochrome.svg" class="logo">
            </a>
            <div class="navbar-links desktop">
                <?php foreach ($nav as $url => $item) { ?>
                    <a href="<?= $url ?>" class="<?= !empty($item['active']) ? 'active' : '' ?>">
                        <?php if ($item['icon']) { ?><img src="<?= $item['icon'] ?>" alt=""><?php } ?>
                        <?= $item['label'] ?>
                    </a>
                <?php } ?>
            </div>
            <div class="navbar-links mobile">
                <div class="navbar-burger" dropdown-button="apps-dropdown">
                    <i data-lucide="menu"></i> Apps
                </div>
            </div>
        </div>
        <div class="navbar-right">
            <div class="navbar-pfp-container">
                <a dropdown-button="bugs" tooltip="suggestions / bugs"
                   class="navbar-right-button"><i data-lucide="bug"></i></a>
                <div dropdown-mode="legacy" dropdown="bugs"
                     class="navbar-pfp-dropdown navbar-pfp-dropdown-hidden">
                    <h1 langkey="navbar/bugs.h1">Help us make Osekai better</h1>
                    <div id="bug-reporter-bug" langkey="navbar/bugs.bug" class="button">Report a bug</div>
                    <div id="bug-reporter-feedback" langkey="navbar/bugs.feedback" class="button">Feature request / Other feedback</div>
                </div>
                <?php
                if (Session::LoggedIn()) {
                    ?>

                    <a class="navbar-right-button" tooltip="settings" dropdown-button="settings-dropdown">
                        <i data-lucide="cog"></i>
                    </a>
                    <a class="navbar-right-button" tooltip="notifications" id="notif-button" dropdown-button="notifs-dropdown">
                        <i data-lucide="bell"></i>
                        <?php
                        if($unreadNotifs > 0) {
                            ?>
                            <div class="notification-pill" id="notif-pill">
                                <?= $unreadNotifs ?>
                            </div>
                            <?php
                        }
                        ?>
                    </a>

                    <div dropdown-mode="legacy" dropdown="notifs-dropdown" id="notifications-overlay" class="notifications-overlay">
                        <h1>
                            <i data-lucide="bell"></i>
                            Notifications
                        </h1>
                        <div id="notifications" class="notification-list"></div>
                    </div>
                    <?php
                }
                ?>

                <div dropdown-mode="legacy" dropdown="settings-dropdown"
                     class="navbar-pfp-dropdown navbar-pfp-dropdown-hidden">
                    <h1 langkey="navbar/settings.h1">Settings</h1>
                    <label setting-item="medals.hideUnachievedMedals" class="toggle-text navbar-pfp-dropdown-item"
                           for="checkbox">
                        <input type="checkbox" class="checkbox" id="checkbox">
                        <p langkey="navbar/settings.hideobtained.title">Completely hide obtained medals</p>
                        <small langkey="navbar/settings.hideobtained.flair">Only enabled when filter is on</small>
                    </label>
                </div>
            </div>
            <div class="navbar-pfp-container">
                <button dropdown-button="pfp-dropdown"><img class="pfp"
                                                            src="<?= Database\Session::GetPFP() ?>"
                                                            alt="Your Profile Picture"></button>
                <div dropdown-mode="legacy" dropdown="pfp-dropdown"
                     class="navbar-pfp-dropdown navbar-pfp-dropdown-hidden"
                     id="navbar-profile-dropdown">
                    <?php
                    if (Session::LoggedIn()) {
                        ?>
                        <a class="navbar-pfp-dropdown-header" href="https://osekai.net/profiles?user=<?= Session::UserData()['id'] ?>">
                            <img src="<?= Database\Session::UserData()['avatar_url'] ?>"
                                 alt="Your Profile Picture">
                            <div>
                                <h1>
                                    <?= Database\Session::UserData()['username'] ?>
                                    <div id="roles"></div>
                                </h1>
                            </div>
                        </a>
                        <a href="https://osekai.net/profiles?user=<?= Session::UserData()['id'] ?>"
                           class="navbar-pfp-dropdown-item"><i data-lucide="user"></i>Your profile</a>
                        <a href="https://osu.ppy.sh/u/<?= Session::UserData()['id'] ?>"
                           class="navbar-pfp-dropdown-item"><i data-lucide="user"></i>Your profile on osu!</a>
                        <a href="/logout" class="navbar-pfp-dropdown-item"><i data-lucide="log-out"></i>Log Out</a>
                    <?php } else {
                        ?>
                        <a href="/login" class="navbar-pfp-dropdown-item"><i simple-icon="osu"></i> Log in with osu!</a>
                    <?php } ?>
                    <div class="debug">
                        <h3>Debug Options</h3>
                        <a onclick="window.debug()">Debug timings (backend)</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="navbar-trim">

    </div>
</div>
<div dropdown-mode="legacy" dropdown="apps-dropdown" class="apps-dropdown navbar-apps-dropdown">
    <?php foreach ($nav as $url => $item) { ?>
        <a href="<?= $url ?>" class="<?= !empty($item['active']) ? 'active' : '' ?>">
            <?php if ($item['icon']) { ?><img src="<?= $item['icon'] ?>" alt=""><?php } ?>
            <?= $item['label'] ?>
        </a>
    <?php } ?>
</div>
<div class="page-container" id="main">
    <?= $page; ?>
</div>
<div class="footer hidden">
    <small>Rendered in {TIME} / Application
        Revision <?= ApplicationVersion::revision() ?></small>
</div>