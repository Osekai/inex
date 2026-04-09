<?php

use Site\Embed;

Embed::SetTitle("Osekai Rankings • The best alternative ranking for osu!");
Embed::SetDescription("the best place to find alternative osu! rankings for medals, ranked maps, and more!");
?>
<div class="page-container-inner rankings-home">
    <div>
        <div class="panel">
            <h1>Add A User</h1>
            <div class="divider"></div>
            <div>
                <input class="input" type="text" placeholder="Username or ID">
                <button class="button">Add</button>
            </div>
        </div>
    </div>
    <div id="rankings-home-panels">

    </div>
</div>


<?php
include("./views/elements/footer.php");
?>