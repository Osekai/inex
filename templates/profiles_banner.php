<!DOCTYPE html>
<html>
<head>
    <title>Profiles</title>
    <link rel="stylesheet" href="/frontend/dist/pb-<?= Site::$profiles_banner->content['Theme']['Key'] ?>.css">
    <script>
        const data = <?= json_encode(Site::$profiles_banner->content) ?>;
    </script>
</head>
<body>
<div class="banner">

    <?= $page; ?>
</div>
</body>
<script src="/frontend/dist/pb-<?= Site::$profiles_banner->content['Theme']['Key'] ?>.bundle.js"></script>
</html>