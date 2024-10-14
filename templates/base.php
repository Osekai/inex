<!DOCTYPE html>
<?php
if (Site::$base_loaded == false) {
    Site::$base_loaded = true;
}
?>
<noscript>
    Sorry, Javascript is required to view this page!
</noscript>

<!DOCTYPE html>
<html>

<head>
    <script id="variables.php">

        const loader = `<?= LOADER ?>`;
        const loaderSmall = `<?= LOADER_SMALL ?>`;
    </script>
    <script>
        const pageName = '<?= $name ?>';
        var userSettings = <?= json_encode(Data\Settings::Get()) ?>;
        const loggedIn = <?= json_encode(Database\Session::LoggedIn()) ?>;
        const mods = <?= json_encode(\Database\Connection::execSimpleSelect("SELECT * FROM Common_Mods", "2mods", 9999)) ?>;
        const countries = <?= json_encode(\Database\Connection::execSimpleSelect("SELECT * FROM Common_Countries", "countries", 9999)) ?>;
        const roles = <?= json_encode(\Database\Connection::execSimpleSelect("SELECT * FROM System_Roles_Roles", "roles", 9999)) ?>;
    </script>

    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="/frontend/dist/<?= $name ?>.css?<?= ApplicationVersion::revision() ?>">
    <link rel="stylesheet" href="/frontend/dist/index.css?<?= ApplicationVersion::revision() ?>">
    <link rel="stylesheet" href="/frontend/dist/<?= $name ?>.css?<?= ApplicationVersion::revision() ?>">
    <?php
    if (Database\Session::LoggedIn()) {
        ?>
        <script>
            const userData = <?= json_encode(Database\Session::UserData()) ?>;
        </script>
        <style>
            :root {
                --user-header-image: url("<?= Database\Session::UserData()['cover_url'] ?>")
            }
        </style>
        <?php
    }
    ?>
    <meta name="darkreader-lock">

    <?php
    \Site\Embed::AddTags(Site\Embed::$title);
    ?>


    <meta property="og:title" content="<?= Site\Embed::$title ?>"/>
    <meta property="og:description" content="<?= Site\Embed::$description ?>"/>

    <?php
    if (\Site\Embed::$article['published_time'] != "") {
        ?>
        <meta name="author" content="<?= Site\Embed::$article["author"] ?>">
        <meta property="og:type" content="article">
        <meta property="og:article:published_time" content="<?= Site\Embed::$article["published_time"] ?>"/>
        <meta property="og:article:author" content="<?= Site\Embed::$article["author"] ?>"/>
        <meta property="og:article:section" content="<?= Site\Embed::$article["section"] ?>"/>
        <meta property="og:article:tag" content="<?= Site\Embed::$article["tags"] ?>"/>
        <meta property="og:author:username" content="<?= Site\Embed::$article["author"] ?>"/>
        <?php
    }
    ?>

    <title><?= Site\Embed::$title ?></title>

    <meta property="og:tags" content="<?= Site\Embed::$article["tags"] ?>"/>
    <meta property="og:locale" content="en_GB"/>
    <meta property="og:site_name" content="Osekai"/>


    <meta name="description" content="<?= Site\Embed::$title ?>">
    <meta name="keywords" content="<?= Site\Embed::$tags ?>">
    <meta name="description" content="<?= Site\Embed::$description ?>">


    <meta name="twitter:site" content="Osekai">
    <meta name="twitter:title" content="<?= Site\Embed::$title ?>">
    <meta name="twitter:description" content="<?= Site\Embed::$description ?>">
    <?php
    if (\Site\Embed::$large_image) {
        ?>
        <meta name="twitter:card" content="summary_large_image">
        <?php
    } else {
        ?>
        <meta name="twitter:card" content="summary">
        <?php
    }
    if (\Site\Embed::$image != null) {
        if (\Site\Embed::$image_width != null) {
            ?>
            <meta property="og:image:width" content="<?= \Site\Embed::$image_width ?>"/>
            <meta property="og:image:height" content="<?= \Site\Embed::$image_height ?>"/>
            <?php
        }
        ?>
        <meta property="og:image" content="<?= Site\Embed::$image ?>"/>
        <meta property="og:image:alt" content="<?= Site\Embed::$image_alt ?>"/>
        <meta name="twitter:image:src"
              content="<?= Site\Embed::$image_banner == null ? Site\Embed::$image : Site\Embed::$image_banner ?>">
        <?php
    }
    ?>

    <meta property="og:type" content="object"/>
    <meta property="og:url" content="<?= Sanitize::HTML($_SERVER['REQUEST_URI']); ?>"/>
</head>

<body>
<div class="content">
    <?= $html; ?>
</div>
</body>


<script rel="preload" src="/frontend/dist/index.bundle.js?<?= ApplicationVersion::revision() ?>" type="module"></script>
<script src="/frontend/dist/<?= $name ?>.bundle.js?<?= ApplicationVersion::revision() ?>" type="module"></script>
</html>