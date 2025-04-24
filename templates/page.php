<?php
$nav = [
    '/' => 'home',
    '/medals' => 'medals',
    '/badges' => 'badges',
    'https://osekai.net/rankings' => 'rankings',
    'https://osekai.net/profiles' => 'profiles'
];

$current = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$current = $current === '' ? '/' : $current;

use Database\Session; ?>

<div class="navbar">
    <a class="skip-link" href='#main'>Skip to content</a>
    <div class="navbar-upper">
        <div class="navbar-left">
            <a href="/">
                <img src="/public/img/branding/icon_monochrome.svg">
            </a>
            <div class="navbar-links">
                <?php foreach ($nav as $url => $label) { ?>
                    <a href="<?= $url ?>" class="<?= $url === $current ? 'active' : '' ?>"><?= $label ?></a>
                <?php } ?>
            </div>
        </div>
        <div class="navbar-right">
            <div class="navbar-pfp-container">
                <a class="navbar-right-button" tooltip="settings" dropdown-button="settings-dropdown">
                    <i data-lucide="cog"></i>
                </a>

                <div dropdown="settings-dropdown" class="navbar-pfp-dropdown navbar-pfp-dropdown-hidden">
                    <h1>Settings</h1>
                    <label setting-item="medals.hideUnachievedMedals" class="toggle-text navbar-pfp-dropdown-item"
                           for="checkbox">
                        <input type="checkbox" class="checkbox" id="checkbox">
                        <p>Completely hide obtained medals</p>
                        <small>Only enabled when filter is on</small>
                    </label>
                </div>
            </div>
            <div class="navbar-pfp-container">
                <button dropdown-button="pfp-dropdown"><img class="pfp"
                                                            src="<?= Database\Session::GetPFP() ?>"
                                                            alt="Your Profile Picture"></button>
                <div dropdown="pfp-dropdown" class="navbar-pfp-dropdown navbar-pfp-dropdown-hidden"
                     id="navbar-profile-dropdown">
                    <?php
                    if (Session::LoggedIn()) {
                        ?>
                        <div class="navbar-pfp-dropdown-header">
                            <img src="<?= Database\Session::UserData()['avatar_url'] ?>"
                                 alt="Your Profile Picture">
                            <div>
                                <h1>
                                    <?= Database\Session::UserData()['username'] ?>
                                    <div id="roles"></div>
                                </h1>
                            </div>
                        </div>
                        <a href="/logout" class="navbar-pfp-dropdown-item"><i data-lucide="log-out"></i>Log Out</a>
                    <?php } else {
                        ?>
                        <a href="/login" class="navbar-pfp-dropdown-item"><i simple-icon="osu"></i> Log in with osu!</a>
                    <?php } ?>
                </div>
            </div>
        </div>
    </div>
    <div class="navbar-trim">

    </div>
</div>
<div class="page-container" id="main">
    <?= $page; ?>
</div>
<div class="footer hidden">
    <small>Rendered in {TIME} / Application
        Revision <?= ApplicationVersion::revision() ?></small>
</div>