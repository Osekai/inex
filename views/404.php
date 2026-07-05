<div class="center e404">
    <?php
    $quotes = [
        "where've we gotten ourselves to?",
        "uh oh, you seem to be lost!",
        "oops, wrong place!",
        "where've you gotten yourself to?",
        "oops! that doesn't exist!",
        "oh no, that page doesn't exist!",
        "oopsies, this page doesn't exist >w<",
        "oops, that page doesn't exist!",
        "you seem to be lost!",
        "where've you ended up?",
        "Uh oh, looks like we hit a dead end!",
        "Oh no! We couldn't find what you were looking for!",
        "It appears you've stumbled upon a page that doesn't exist!",
        "Oops, looks like we took a wrong turn somewhere!"
    ];

    $subtexts = [
        "let's get you back on track.",
        "maybe somewhere below is where you want to be?",
        "pick a place from our nice selection below!",
        "let's get you back home... or another app, your choice:",
        "let's get you back on track!",
        "I'm trying my best to figure out where you are, but I just have no clue...",
        "Let's not give up hope just yet. Take a look at some of our recommended pages below.",
        "Don't worry, we've got your back. Explore some of our popular sections below and find your way back on track.",
        "Let's try not to get too upset about it. Check out some of our other pages below and see if we can find what you're looking for.",
        "Let's get you back on the right path with some of our suggested pages below."
    ];

    $quote = $quotes[array_rand($quotes)];
    $subtext = $subtexts[array_rand($subtexts)];
    ?>

    <div class="left">
        <div class="texts">
            <p>404</p>
            <h1><?php echo $quote; ?></h1>
            <h3><?php echo $subtext; ?></h3>
        </div>
        <div class="buttons">
            <a href="/" class="button big">home</a>
            <a href="/medals" class="button big">medals</a>
            <a href="/badges" class="button big">badges</a>
            <a href="/rankings" class="button big">rankings</a>
        </div>
    </div>
    <div class="right">
        <img src="/public/img/no_results.png" class="tooltip" tooltip="art by NyuPenyu">
    </div>
</div>
<?php
include("./views/elements/footer.php");
?>