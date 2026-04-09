<?php

use Site\Embed;

$ranking = $args[0];
switch($ranking) {
    case "medals_users":
        Embed::SetTitle("Osekai Rankings / Medals / Users");
        Embed::SetDescription("users ranked by how many medals they have!");
        break;

    case "medals_rarity":
        Embed::SetTitle("Osekai Rankings / Medals / Rarity");
        Embed::SetDescription("medals ranked by rarity");
        break;

    case "pp":
        Embed::SetTitle("Osekai Rankings / All Mode / pp");
        Embed::SetDescription("users ranked by pp - total and standard deviated!");
        break;

    case "level":
        Embed::SetTitle("Osekai Rankings / All Mode / Level");
        Embed::SetDescription("users ranked by level - total and standard deviated!");
        break;

    case "accuracy":
        Embed::SetTitle("Osekai Rankings / All Mode / Accuracy");
        Embed::SetDescription("users ranked by accuracy - total and standard deviated!");
        break;

    case "replays":
        Embed::SetTitle("Osekai Rankings / All Mode / Replays");
        Embed::SetDescription("users ranked by replays watched");
        break;

    case "mapsets":
        Embed::SetTitle("Osekai Rankings / Mappers / Mapsets");
        Embed::SetDescription("users ranked by mapsets");
        break;

    case "subscribers":
        Embed::SetTitle("Osekai Rankings / Mappers / Subscribers");
        Embed::SetDescription("users ranked by subscribers");
        break;

    case "badges":
        Embed::SetTitle("Osekai Rankings / Badges / Badges");
        Embed::SetDescription("users ranked by badges");
        break;
}

?>
<div class="rankings__outer">
    <div class="list__area">

        <div class="list__bar" id="categories-outer">
            <div class="pages" id="pages">

            </div>
        </div>
        <div class="list__bar-outer">
            <div class="list__bar list__bar-options">
                <div id="ranking-options-area">

                </div>
                <pagination-el link-id="ranking"></pagination-el>
                <div>
                    <searchable-dropdown id="searchtype-dropdown"></searchable-dropdown>
                    <input type="text" class="input" placeholder="Search users" id="search-bar">
                </div>
            </div>
        </div>
        <div  class="list__content">
            <div id="ranking-table-area">

            </div>
            <pagination-el link-id="ranking" primary></pagination-el>
        </div>
    </div>
</div>

<?php
include("./views/elements/footer.php");
?>


