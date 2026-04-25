<?php
\Site\Embed::SetTitle("Osekai INEX");
\Site\Embed::SetDescription("Osekai INEX is the next generation of Osekai. Learn More");
\Site\Embed::SetBannerImage("/public/img/inex-banner.png");

?>


<div class="home-welcome" id="home-welcome">
    <div id="unicorn"></div>
    <div class="content">
        <div class="logo">
            <div id="logo-anim"></div>
            <h1>INEX</h1>
        </div>
        <p langkey="home/header.h1">The next generation of Osekai</p>
    </div>
</div>

<div class="welcome-to-osekai">
    <div class="page-container-inner">
        <h1>Welcome to the new Osekai!</h1>
        <p>We've been working on rewriting the entire site from the ground up, and the rewrite currently features
            Medals,
            Rankings, and Badges!</p>
        <p>Over the years, the previous version of Osekai, known as "Eclipse", grew large and unmaintainable, and in
            such a
            state we felt a rewrite was worth the effort!</p>
        <p>We're hoping to bring over Snapshots and Profiles soon, but we don't feel right doing it without doing it
            properly, so it'll be a little while longer for those!</p>
    </div>
</div>

<div class="page-container-inner">
    <h1>Explore INEX</h1>
    <div class="app big medals col-reset">
        <img src="/public/img/home/apps/medals.png">
        <div>
            <h1>Osekai <strong>Medals</strong></h1>
            <p>Explore solutions, leave comments, and suggest beatmaps on every medal across osu!, all in one place!</p>
            <a href="/medals" class="button">Explore Medals</a>
        </div>
    </div>
    <div class="app big rankings col-reset">
        <img src="/public/img/home/apps/rankings.png">
        <div>
            <h1>Osekai <strong>Rankings</strong></h1>
            <p>Explore interactive player rankings across medals, mapping, all-mode pp, and more</p>
            <a href="/rankings" class="button">Explore Rankings</a>
        </div>
    </div>
    <div class="app big badges col-reset">
        <img src="/public/img/home/apps/badges.png">
        <div>
            <h1>Osekai <strong>Badges</strong></h1>
            <p>Check out every badge across the entirety of osu!, along with which players have them, and when they got them!</p>
            <a href="/badges" class="button">Explore Badges</a>
        </div>
    </div>
</div>
<div class="page-container-inner">
    <h1>Classic/Eclipse Apps</h1>
    <div class="classic-apps">
        <div class="app classic snapshots col-reset">
            <img src="/public/img/home/apps/snapshots.png">
            <div>
                <h1>Osekai <strong>Snapshots</strong></h1>
                <p>Explore our archive of osu! versions, dating from 2007 to now!</p>
                <a href="https://osekai.net/snapshots" class="button">Explore Snapshots</a>
            </div>
        </div>
        <div class="app classic profiles col-reset">
            <img src="/public/img/home/apps/profiles.png">
            <div>
                <h1>Osekai <strong>Profiles</strong></h1>
                <p>Get in-depth information about your osu! profile, map out your past in a timeline, and create future goals!</p>
                <a href="https://osekai.net/profiles" class="button">Explore Profiles</a>
            </div>
        </div>
    </div>
</div>
<div class="page-container-inner">
    <h1>How to help</h1>
    <p>We're always looking for new contributors to help us out with the site, and we're always looking for new ideas to
        implement!</p>
    <p>If you're interested in contributing, please check out the github repository at <a href="https://github.com/osekai/inex">https://github.com/osekai/inex</a> or join our development discord at <a href="https://discord.gg/zJY3W5smpU">discord.gg/zJY3W5smpU</a></p>
    <h1>Bugs?</h1>
    <p>If you find any bugs, please report them on our github repository at <a href="https://github.com/osekai/inex/issues">https://github.com/osekai/inex/issues</a>!</p>
</div>

<?php include("./views/elements/footer.php"); ?>
