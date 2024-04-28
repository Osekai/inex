<div class="mobile-toolbar mobile">
    <a href="/home"><i data-lucide="home"></i></a>
    <a href="/explore"><i data-lucide="book-image"></i></a>
    <a href="/@<?= \Database\Session::UserData()['Tag'] ?>"><i data-lucide="user"></i></a>
    <a href="/settings"><i data-lucide="cog"></i></a>
</div>
<div class="navbar">
    <a class="skip-link" href='#main'>Skip to content</a>
    <div class="navbar-upper">
        <div class="navbar-left">
            Osekai INEX
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

<small>Rendered in {TIME} / <?= ApplicationVersion::get() ?> / Application
    Revision <?= ApplicationVersion::revision() ?></small>