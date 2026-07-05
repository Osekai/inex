<?php

use Data\Home\Member;

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
        <h1 langkey="home/welcome.h1">Welcome to the new Osekai!</h1>
        <p langkey="home/welcome.p1">We've been working on rewriting the entire site from the ground up, and the rewrite
            currently features
            Medals,
            Rankings, and Badges!</p>
        <p langkey="home/welcome.p2">Over the years, the previous version of Osekai, known as "Eclipse", grew large and
            unmaintainable, and in
            such a
            state we felt a rewrite was worth the effort!</p>
        <p langkey="home/welcome.p3">We're hoping to bring over Snapshots and Profiles soon, but we don't feel right
            doing it
            without doing it
            properly, so it'll be a little while longer for those!</p>
    </div>
</div>

<div class="page-container-inner" data-aos data-aos-type="slide-up">
    <h1 langkey="home/explore.header.inex">Explore INEX</h1>
    <div class="app big medals col-reset">
        <img src="/public/img/home/apps/medals.png">
        <div>
            <h1>Osekai <strong>Medals</strong></h1>
            <p langkey="home/explore.medals.h1">Explore solutions, leave comments, and suggest beatmaps on every medal
                across osu!, all in one place!</p>
            <a href="/medals" class="button" langkey="home/explore.medals.cta">Explore Medals</a>
        </div>
    </div>
    <div class="app big rankings col-reset">
        <img src="/public/img/home/apps/rankings.png">
        <div>
            <h1>Osekai <strong>Rankings</strong></h1>
            <p langkey="home/explore.rankings.h1">Explore interactive player rankings across medals, mapping, all-mode
                pp, and more</p>
            <a href="/rankings" class="button" langkey="home/explore.rankings.cta">Explore Rankings</a>
        </div>
    </div>
    <div class="app big badges col-reset">
        <img src="/public/img/home/apps/badges.png">
        <div>
            <h1>Osekai <strong>Badges</strong></h1>
            <p langkey="home/explore.badges.h1">Check out every badge across the entirety of osu!, along with which
                players have them, and when they got
                them!</p>
            <a href="/badges" class="button" langkey="home/explore.badges.cta">Explore Badges</a>
        </div>
    </div>
</div>
<div class="page-container-inner" data-aos data-aos-type="slide-up">
    <h1 langkey="home/explore.header.legacy">Classic/Eclipse Apps</h1>
    <div class="classic-apps">
        <div class="app classic snapshots col-reset">
            <img src="/public/img/home/apps/snapshots.png">
            <div>
                <h1>Osekai <strong>Snapshots</strong></h1>
                <p langkey="home/explore.snapshots.h1">Explore our archive of osu! versions, dating from 2007 to
                    now!</p>
                <a href="https://osekai.net/snapshots" class="button" langkey="home/explore.snapshots.cta">Explore
                    Snapshots</a>
            </div>
        </div>
        <div class="app classic profiles col-reset">
            <img src="/public/img/home/apps/profiles.png">
            <div>
                <h1>Osekai <strong>Profiles</strong></h1>
                <p langkey="home/explore.profiles.h1">Get in-depth information about your osu! profile, map out your
                    past in a timeline, and create future
                    goals!</p>
                <a href="https://osekai.net/profiles" class="button" langkey="home/explore.profiles.cta">Explore
                    Profiles</a>
            </div>
        </div>
    </div>
</div>
<div class="page-container-inner" data-aos data-aos-type="slide-up">
    <?php
    $developers = [
        new Member(10379965, "Tanza", "Project Lead"),
        new Member(2211396, "Badewanne3", "Rankings Data Engineer"),
        (new Member(1309242, "mulraf", "Lead Developer & Creator of Osekai"))->SetActive(false),
        (new Member(7197172, "jiniux", "Developer"))->SetActive(false)->SetOtherNames(["AlexS4v"]),
        (new Member(9350342, "EXtremeExploit", "Developer"))->SetActive(false)->SetOtherNames(["Pedrito"]),
        (new Member(14125695, "TheEggo", "Snapshots Developer"))->SetActive(false),
        (new Member(3357640, "Electroyan", "Rankings Data Engineer"))->SetActive(false),
    ];
    $staff = [
        new Member(18152711, "MegaMix_Craft", ""),
        new Member(16487835, "ILuvSkins", "Snapshots Manager"),
        new Member(12453848, "glassive", "Community Manager"),
        (new Member(1699875, "Remyria", "Community Manager"))->SetActive(false),
    ];

    $moderators = [
        new Member(10238680, "chromb", "Moderator"),
        new Member(7279762, "Coppertine", "Moderator"),
        new Member(13175102, "bentokage", "Moderator"),
        new Member(14889628, "Tomy", "Moderator"),
        new Member(13475402, "Retiu", "Moderator"),
        new Member(10792516, "Eyeonized", "Medals Moderator"),
        new Member(17465623, "yandax", "Medals Moderator"),
    ];

    $legacyDonators = [
        [8923804, "vexAkita", 245.12],
        [11539225, "[HD]Urrk", 79.54],
        [6291386, "Tactic", 49.78],
        [12453848, "Glassive", 29.61],
        [17058819, "2th", 20.00],
        [14741282, "Cyrius", 18.56],
        [7111139, "Chinoya", 12.77],
        [7671790, "Komm", 10.10],
        [2330619, "Mr HeliX", 10.00],
        [7279762, "Coppertine", 10.00],
        [16849319, "janmagtoast", 8.41],
        [16196079, "Romania", 7.27],
        [1699875, "Remyria", 7.27],
        [14889628, "Tomy", 5.73],
        [6403393, "Kotoki1337", 5.07],
        [25695490, "W-108", 5.00],
        [14125695, "TheEggo", 5.00],
        [11954090, "an3", 5.00],
        [8511890, "McSqueezy", 5.00],
        [15716075, "SSilvester", 5.00],
        [18152711, "MegaMix_Craft", 5.00],
        [10238680, "chromb", 5.00],
        [12433422, "Hap", 5.00],
        [13641450, "CBT", 4.20],
        [10491903, "RaFaReAcH", 4.08],
        [10504284, "Wolfey-", 1.90],
        [17416390, "DJMakerMusician", 1.00],
    ];
    ?>

    <h1 langkey="home/team.h1">Our Team</h1>
    <p>Osekai has been in constant development since 2019, and has had lots of various amazing people working on it over
        the years! We've tried to document everyone who's contributed here.</p>

    <div class="team-section">
        <h1>Core Contributors</h1>
        <div class="team-grid">
            <?php
            foreach ($developers as $member) {
                $member->Panel();
            }
            ?>
        </div>
    </div>
    <div class="team-section">
        <h1>Staff</h1>
        <div class="team-grid">
            <?php
            foreach ($staff as $member) {
                $member->Panel();
            }
            ?>
        </div>
    </div>
    <div class="team-section">
        <h1>Moderators</h1>
        <div class="team-grid">
            <?php
            foreach ($moderators as $member) {
                $member->Panel();
            }
            ?>
        </div>
    </div>
    <div class="team-section">
        <h1>Legacy Donators</h1>
        <div class="donator-grid">
            <?php
            foreach ($legacyDonators as $donator) {
                ?>
            <a class="donator-card" href="https://osu.ppy.sh/u/<?= $donator[0] ?>">
                <img src="https://a.ppy.sh/<?= $donator[0] ?>">
                <h1><?= $donator[1] ?></h1>
                <p>€<?= $donator[2] ?></p>
            </a>
            <?php
            }
            ?>
        </div>
    </div>
</div>
<div class="page-container-inner" data-aos data-aos-type="slide-up">
    <h1 langkey="home/help.h1">How to help</h1>
    <p langkey="home/help.p1">We're always looking for new contributors to help us out with the site, and we're always
        looking for new ideas to
        implement!</p>
    <p langkey="home/help.p2">If you're interested in contributing, please check out the github repository at <a
                href="https://github.com/osekai/inex">https://github.com/osekai/inex</a> or join our development discord
        at <a href="https://discord.gg/zJY3W5smpU">discord.gg/zJY3W5smpU</a></p>
    <h1 langkey="home/bugs.h1">Bugs?</h1>
    <p langkey="home/bugs.p">If you find any bugs, please report them on our github repository at <a
                href="https://github.com/osekai/inex/issues">https://github.com/osekai/inex/issues</a>!</p>
</div>

<?php include("./views/elements/footer.php"); ?>
