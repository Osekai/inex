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
</head>

<body>
<div class="content">
    <?= $html; ?>
</div>
</body>


<script rel="preload" src="/frontend/dist/index.bundle.js?<?= ApplicationVersion::revision() ?>" type="module"></script>
<script src="/frontend/dist/<?= $name ?>.bundle.js?<?= ApplicationVersion::revision() ?>" type="module"></script>
</html>