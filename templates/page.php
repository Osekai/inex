<?php

use Database\Session;

?>

<div class="navbar">
    <a class="skip-link" href='#main'>Skip to content</a>
    <div class="navbar-upper">
        <div class="navbar-left">
            <img src="/public/img/branding/icon_monochrome.svg">
            <div class="navbar-links">
                <a href="https://osekai.net/home">home</a>
                <a href="/medals">medals</a>
                <a href="https://osekai.net/rankings">ranking</a>
                <a href="https://osekai.net/profiles">profiles</a>
                <a href="https://osekai.net/snapshots">snapshots</a>
            </div>
        </div>
        <div class="navbar-right">
            <?php
            //use Data;
            if (Database\Session::LoggedIn()) {
                ?>
                <div class="navbar-pfp-container">
                    <button dropdown-button="pfp-dropdown"><img class="pfp"
                                                                src="<?= Database\Session::UserData()['avatar_url'] ?>"
                                                                alt="Your Profile Picture"></button>
                    <div dropdown="pfp-dropdown" class="navbar-pfp-dropdown navbar-pfp-dropdown-hidden"
                         id="navbar-profile-dropdown">
                        <div class="navbar-pfp-dropdown-header">
                            <img src="<?= Database\Session::UserData()['avatar_url'] ?>"
                                 alt="Your Profile Picture">
                            <div>
                                <h1>
                                    <?= Database\Session::UserData()['username'] ?>
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
                <?php
            } else {
                ?>
                <a href="/login" class="button icon-button"><i simple-icon="osu"></i> Log in with osu!</a>
                <?php
            }
            ?>
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