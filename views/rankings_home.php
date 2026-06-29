<?php

use Site\Embed;

Embed::SetTitle("Osekai Rankings • The best alternative ranking for osu!");
Embed::SetDescription("the best place to find alternative osu! rankings for medals, ranked maps, and more!");
?>
<div class="page-container-inner rankings-home">
    <div>
        <div class="welcomepanel" bug="rankings/home/welcome">
            <img src="/public/img/branding/app/rankings.svg">
            <h2>Welcome to</h2>
            <h1>Osekai Rankings!</h1>
            <p>Osekai Rankings is a place to find alternative rankings for osu! medals, ranked maps, and more!</p>
        </div>

        <div class="panel" id="addpanel" bug="rankings/home/add">
            <h1>Add A User</h1>
            <div class="divider"></div>
            <p>Add someone to Osekai - they'll take 1-5 days to show up in the rankings!</p>
            <div><br><!--dont ask im tired--></div>
            <p>You can use this to add missing badges to Badges, or improve our data accuracy!</p>
            <div class="add-form">
                <div class="input-with-text slide">
                    <p>Username or ID</p>
                    <input id="add_userid" class="input" type="text" placeholder="">
                </div>
                <button class="button" id="add_addbutton">Add</button>
            </div>
            <warning>Please do not spam lots of users! If you have lots of people to add, contact us!</warning>
        </div>
    </div>
    <div id="rankings-home-panels" bug="rankings/home/panels">

    </div>
</div>


<?php
include("./views/elements/footer.php");
?>