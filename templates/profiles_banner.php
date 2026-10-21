<!DOCTYPE html>
<html>
<head>
    <title>Profiles</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/frontend/dist/pb-<?= Site::$profiles_banner->content['Theme']['Key'] ?>.css">
    <style id="dyn-theme">
        :root {
        <?= \Data\Profiles\Banners::$themeParser->css ?>
        }
    </style>
    <script>
        const data = <?= json_encode(Site::$profiles_banner->content) ?>;
    </script>
</head>
<?php // the site's .gamemode-* classes set --hue, so on body they retint every --col-* var for the banner's mode ?>
<body class="gamemode-<?= htmlspecialchars($modeKey) ?>">
<div class="banner <?= \Data\Profiles\Banners::$themeParser->classes ?>" id="banner">

    <?= $page; ?>
</div>
</body>
<script src="/frontend/dist/pb-<?= Site::$profiles_banner->content['Theme']['Key'] ?>.bundle.js"></script>
</html>