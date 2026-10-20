<!DOCTYPE html>
<html>
<head>
    <title>Profiles</title>
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
<body>
<div class="banner <?= \Data\Profiles\Banners::$themeParser->classes ?>" id="banner">

    <?= $page; ?>
</div>
</body>
<script src="/frontend/dist/pb-<?= Site::$profiles_banner->content['Theme']['Key'] ?>.bundle.js"></script>
</html>