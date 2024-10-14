<?php

use Database\Session; ?>

<div class="navbar">
    <a class="skip-link" href='#main'>Skip to content</a>
    <div class="navbar-upper">
        <div class="navbar-left">
            <a href="/">
                <img src="/public/img/branding/icon_monochrome.svg">
            </a>
            <div class="navbar-links">
                <a href="/">home</a>
                <a href="/medals">medals</a>
                <a href="https://osekai.net/rankings">ranking</a>
                <a href="https://osekai.net/profiles">profiles</a>
            </div>
        </div>
        <div class="navbar-right">
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