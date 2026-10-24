<?php

namespace Data\Archive;

use API\Response;
use Data\OsekaiUsers;
use Data\Archive;
use Database\Connection;
use Database\Session;

class Mirrors
{
    public static function Add($versionId, $name, $url): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.edit")) return new Response(false, "You can't do that");
        if (!is_numeric($versionId)) return new Response(false, "Invalid version");

        $version = Connection::execSelect("SELECT ID FROM Snapshots_Versions WHERE ID = ?", "i", [$versionId]);
        if (count($version) == 0) return new Response(false, "Version not found");

        $name = trim($name);
        $url = trim($url);
        if ($name == "") return new Response(false, "Name can't be empty");
        if (mb_strlen($name) > 128) return new Response(false, "Name is too long (128 characters max)");
        if (!filter_var($url, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//', $url)) return new Response(false, "Invalid URL");
        if (strlen($url) > 512) return new Response(false, "URL is too long (512 characters max)");

        Connection::execOperation("INSERT INTO Snapshots_Versions_Download_Mirrors (Version_ID, Name, URL) VALUES (?, ?, ?)", "iss", [$versionId, $name, $url]);

        return Archive::Get($versionId);
    }

    public static function Remove($id): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.edit")) return new Response(false, "You can't do that");
        if (!is_numeric($id)) return new Response(false, "Invalid mirror");

        $mirror = Connection::execSelect("SELECT * FROM Snapshots_Versions_Download_Mirrors WHERE ID = ?", "i", [$id]);
        if (count($mirror) == 0) return new Response(false, "Mirror not found");

        Connection::execOperation("DELETE FROM Snapshots_Versions_Download_Mirrors WHERE ID = ?", "i", [$id]);

        return Archive::Get($mirror[0]['Version_ID']);
    }
}
