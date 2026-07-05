<div class="page-container-inner">
    <?php
    $privacy = file_get_contents("./views/text/guidelines.md");
    $html = Markdown::Parse($privacy);
    ?>
    <div class="markdown dark">
        <?= $html ?>
    </div>
</div>

<?php
include("./views/elements/footer.php");
?>