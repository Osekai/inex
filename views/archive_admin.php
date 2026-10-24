<?php
\Site\Embed::$title = "Osekai Archive / Admin";
?>
<div class="archive-admin">
    <a class="archive-admin-back" href="/archive"><i data-lucide="chevron-left"></i> Back to Archive</a>
    <div class="archive-admin-columns">
        <div class="archive-admin-left">
    <?php if (\Data\OsekaiUsers::HasPermission("snapshots.admin.version.create")) { ?>
        <div class="panel">
            <div class="panel-header">
                <h1>New Version</h1>
            </div>
            <div class="divider"></div>
            <div class="archive-admin-create" id="create"></div>
        </div>
    <?php } ?>
    <?php if (\Data\OsekaiUsers::HasPermission("snapshots.admin.featured")) { ?>
        <div class="panel">
            <div class="panel-header">
                <h1>Featured</h1>
            </div>
            <div class="divider"></div>
            <p class="archive-admin-info">Versions shown in the big carousel on the Archive homepage, until their end date.</p>
            <div class="archive-admin-create" id="featured_create"></div>
            <div class="archive-admin-list" id="featured_list"></div>
        </div>
    <?php } ?>
    <?php if (\Data\OsekaiUsers::HasPermission("snapshots.admin.submissions")) { ?>
        <div class="panel">
            <div class="panel-header">
                <h1>Submissions</h1>
            </div>
            <div class="divider"></div>
            <div class="archive-admin-list" id="submissions"></div>
        </div>
    <?php } ?>
        </div>
        <div class="archive-admin-right">
    <?php if (\Data\OsekaiUsers::HasPermission("snapshots.admin.version.migrate")) { ?>
        <div class="panel">
            <div class="panel-header">
                <h1>Migrate from Eclipse</h1>
            </div>
            <div class="divider"></div>
            <p class="archive-admin-info">Versions on the old site which aren't on this one yet. Migrated versions start unpublished.</p>
            <div class="archive-admin-list" id="legacy"></div>
        </div>
    <?php } ?>
        </div>
    </div>
</div>
