<?php
\Site\Embed::SetTitle("Osekai INEX");
\Site\Embed::SetDescription("Osekai INEX is the next generation of Osekai. Learn More");
\Site\Embed::SetBannerImage("/public/img/inex-banner.png");

?>
<style>
    * {
        --hue: 200 !important;
    }
</style>

<div class="home-welcome">
    <img src="/public/img/branding/icon_monochrome.svg">
    <h1>Welcome to <strong>Osekai INEX</strong></h1>
    <p>INEX is a complete rewrite of Osekai from the ground up, built for performance and stability.</p>
</div>
<div class="outer-differences">
    <div class="page-container-inner differences">
        <div class="home-difference">
            <h1>What's the difference between Osekai (Eclipse) and Osekai INEX?</h1>
            <div>
                <div>
                    <h1>Eclipse</h1>
                    <p>Eclipse is the version of Osekai in use since 2021. Many links on this site, such as Profiles,
                        Rankings, etc. will still link to this page.</p>
                    <img src="/public/img/home/eclipse.png">
                </div>
                <div>
                    <h1>INEX</h1>
                    <p>INEX is a complete rewrite of Osekai, currently in beta. Right now, Osekai Medals is the only
                        supported site, more are coming soon!</p>
                    <img src="/public/img/home/inex.png">
                </div>
            </div>
        </div>
    </div>
</div>
<div class="page-container-inner">
    <div class="home-panel medals">
        <img src="/public/img/home/apps/medals.png">
        <div>
            <h1>Medals</h1>
            <p>The best place to find solutions for every osu! medal, the best beatmaps to use, and even converse
                in the comments! </p>
            <a class="button cta" href="/medals">Get those medals!</a>
        </div>
    </div>
    <div class="home-panel-sbs">
        <div class="home-panel medals">
            <img src="/public/img/home/apps/rankings.png">
            <div>
                <h1>Rankings <span>Eclipse</span></h1>
                <p>View leaderboards for medal count, badge count, total PP, ranked maps, Kudosu, and more!</p>
                <a class="button cta" href="https://osekai.net/rankings">Rankings.</a>
            </div>
        </div>
        <div class="home-panel medals">
            <img src="/public/img/home/apps/profiles.png">
            <div>
                <h1>Profiles <span>Eclipse</span></h1>
                <p>Learn more about your medal history, set goals and timeline points, and get a cool image for your
                    osu! me! section!</p>
                <a class="button cta" href="https://osekai.net/profiles">Profiles :3</a>
            </div>
        </div>
    </div>

    <?php
    \Data\OsekaiUsers::GetUser(10379965, true);
    ?>
</div>
<div class="footer">
    <div class="center">
    <?php include("./views/elements/footer-inner.php"); ?>
    </div>
    </div>