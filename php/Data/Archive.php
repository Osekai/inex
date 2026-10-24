<?php

namespace Data;

use API\Response;
use AWS\S3;
use Database\Connection;
use Image\GetImage;

class Archive
{
    public static function DownloadPath($version, $format = null): string
    {
        if ($format == null) {
            $format = $version['File_Format'];
        }
        return "version/" . $version['ID'] . "/" . $version['Version'] . "." . $format;
    }

    // admins see unpublished versions, everyone else doesn't know they exist
    public static function CanSeeUnpublished(): bool
    {
        return OsekaiUsers::HasPermission("snapshots.admin");
    }

    public static function GetGroups(): Response
    {
        $groups = Connection::execSimpleSelect("SELECT * FROM Snapshots_Groups ORDER BY `Order` ASC");
        return new Response(true, "Success", $groups);
    }

    public static function GetAll(): Response
    {
        $published = "WHERE v.Published = 1";
        if (Archive::CanSeeUnpublished()) {
            $published = "";
        }

        $versions = Connection::execSimpleSelect("
            SELECT v.ID, v.Version, v.Release_Date, v.Group_ID, v.Published, v.Meta_Name, v.Meta_Archival_Date, v.Meta_Archiver_ID,
                   v.Analytics_Views, v.Analytics_Downloads, u.Name AS Archiver_Name,
                   (SELECT s.ID FROM Snapshots_Versions_Screenshots s WHERE s.Version_ID = v.ID ORDER BY s.`Order` ASC LIMIT 1) AS Thumbnail_ID
            FROM Snapshots_Versions v
            LEFT JOIN Rankings_Users u ON u.ID = v.Meta_Archiver_ID
            $published
            ORDER BY v.Release_Date DESC
        ");

        foreach ($versions as &$version) {
            $version['Thumbnail'] = null;
            if ($version['Thumbnail_ID'] != null) {
                $version['Thumbnail'] = GetImage::ArchiveScreenshot("thumb", $version['Thumbnail_ID'], $version['ID']);
            }
        }
        unset($version);

        return new Response(true, "Success", $versions);
    }

    public static function Get($id): Response
    {
        if (!is_numeric($id)) return new Response(false, "Invalid version");

        $version = Connection::execSelect("SELECT v.*, u.Name AS Archiver_Name FROM Snapshots_Versions v LEFT JOIN Rankings_Users u ON u.ID = v.Meta_Archiver_ID WHERE v.ID = ?", "i", [$id]);
        if (count($version) == 0) return new Response(false, "Version not found");
        $version = $version[0];
        if ($version['Published'] != 1 && !Archive::CanSeeUnpublished()) return new Response(false, "Version not found");

        $screenshots = Connection::execSelect("SELECT * FROM Snapshots_Versions_Screenshots WHERE Version_ID = ? ORDER BY `Order` ASC", "i", [$id]);
        foreach ($screenshots as &$screenshot) {
            $screenshot['Thumb'] = GetImage::ArchiveScreenshotObject("thumb", $screenshot);
            $screenshot['Full'] = GetImage::ArchiveScreenshotObject("full", $screenshot);
        }
        unset($screenshot);

        $version['Screenshots'] = $screenshots;
        $version['Mirrors'] = Connection::execSelect("SELECT * FROM Snapshots_Versions_Download_Mirrors WHERE Version_ID = ? ORDER BY ID ASC", "i", [$id]);
        $version['Download'] = null;
        if ($version['File_Format'] != null) {
            $version['Download'] = S3::getUrl(Archive::DownloadPath($version));
        }

        return new Response(true, "Success", $version);
    }

    // same as eclipse, just a counter
    public static function Record($id, $type): Response
    {
        if (!is_numeric($id)) return new Response(false, "Invalid version");

        // unpublished ones are only being looked at by admins, don't count those
        if ($type == "view") {
            Connection::execOperation("UPDATE Snapshots_Versions SET Analytics_Views = Analytics_Views + 1 WHERE ID = ? AND Published = 1", "i", [$id]);
        } else if ($type == "download") {
            Connection::execOperation("UPDATE Snapshots_Versions SET Analytics_Downloads = Analytics_Downloads + 1 WHERE ID = ? AND Published = 1", "i", [$id]);
        } else {
            return new Response(false, "Invalid type");
        }

        return new Response(true, "ok");
    }
}
