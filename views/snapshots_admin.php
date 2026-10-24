<?php
\Site\Embed::$title = "Osekai Snapshots / Admin";
?>
<div class="snapshots-admin">
    <a class="snapshots-admin-back" href="/snapshots"><i data-lucide="chevron-left"></i> Back to Snapshots</a>
    <div class="snapshots-admin-columns">
        <div class="snapshots-admin-left">
    <?php if (\Data\OsekaiUsers::HasPermission("snapshots.admin.version.create")) { ?>
        <div class="panel">
            <div class="panel-header">
                <h1>New Version</h1>
            </div>
            <div class="divider"></div>
            <div class="snapshots-admin-create" id="create"></div>
        </div>
    <?php } ?>
    <?php if (\Data\OsekaiUsers::HasPermission("snapshots.admin.submissions")) { ?>
        <div class="panel">
            <div class="panel-header">
                <h1>Submissions</h1>
            </div>
            <div class="divider"></div>
            <div class="snapshots-admin-list" id="submissions"></div>
        </div>
    <?php } ?>
        </div>
        <div class="snapshots-admin-right">
    <?php if (\Data\OsekaiUsers::HasPermission("snapshots.admin.version.migrate")) { ?>
        <div class="panel">
            <div class="panel-header">
                <h1>Migrate from Eclipse</h1>
            </div>
            <div class="divider"></div>
            <p class="snapshots-admin-info">Versions on the old site which aren't on this one yet. Migrated versions start unpublished.</p>
            <div class="snapshots-admin-list" id="legacy"></div>
        </div>
    <?php } ?>
        </div>
    </div>
</div>
