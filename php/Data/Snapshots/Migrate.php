<?php

namespace Data\Snapshots;

use API\Response;
use Data\OsekaiUsers;
use Data\Snapshots;
use Database\Connection;
use Database\Session;

// pulls versions over from eclipse, through the same create/edit/upload flow an admin would use
class Migrate
{
    const ECLIPSE_URL = "https://osekai.net";

    static function Fetch($url)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        $data = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($data === false || $status != 200) return null;
        return $data;
    }

    // straight to disk, zips can be huge
    static function DownloadTo($url, $path)
    {
        $fp = fopen($path, "wb");
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 0);
        $ok = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        fclose($fp);

        if ($ok === false || $status != 200) {
            unlink($path);
            return false;
        }
        return true;
    }

    static function TempPath($name)
    {
        return sys_get_temp_dir() . "/snapshots_migrate_" . bin2hex(random_bytes(6)) . "_" . basename($name);
    }

    // a couple of old versions have stray spaces or an osu! prefix
    static function CleanVersion($version)
    {
        $version = trim($version);
        if (str_starts_with($version, "osu!")) {
            $version = substr($version, 4);
        }
        return $version;
    }

    // eclipse has a few empty rows with no version info at all
    static function IsValidLegacy($legacy)
    {
        return isset($legacy['version_info']['version']) && isset($legacy['version_info']['release']);
    }

    static function VersionFolderUrl($legacy)
    {
        return Migrate::ECLIPSE_URL . "/snapshots/versions/" . rawurlencode($legacy['version_info']['version']) . "/";
    }

    // eclipse stored downloads as either {name, link} or [name, link] depending on how they got added
    static function ParseDownloads($legacy)
    {
        $main = null;
        $mirrors = [];
        foreach ($legacy['downloads'] ?? [] as $download) {
            $name = $download['name'] ?? $download[0] ?? null;
            $link = $download['link'] ?? $download[1] ?? null;
            if ($name == null || $link == null) continue;
            $link = trim($link);

            if ($name == "Osekai Servers") {
                $main = Migrate::VersionFolderUrl($legacy) . rawurlencode($link);
            } else {
                $mirrors[] = ["Name" => $name, "URL" => $link];
            }
        }
        return [$main, $mirrors];
    }

    static function ScreenshotUrl($legacy, $screenshot)
    {
        // a few old ones point straight at other sites
        if (str_starts_with($screenshot, "http")) return $screenshot;
        return Migrate::VersionFolderUrl($legacy) . rawurlencode($screenshot);
    }

    static function GetLegacyAll()
    {
        $data = Migrate::Fetch(Migrate::ECLIPSE_URL . "/snapshots/api/api.php");
        if ($data == null) return null;
        return json_decode($data, true);
    }

    public static function GetLegacy(): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.migrate")) return new Response(false, "You can't do that");

        $legacyAll = Migrate::GetLegacyAll();
        if ($legacyAll == null) return new Response(false, "Couldn't reach eclipse");

        $existing = [];
        foreach (Connection::execSimpleSelect("SELECT Version FROM Snapshots_Versions") as $row) {
            $existing[$row['Version']] = true;
        }

        $list = [];
        foreach ($legacyAll as $legacy) {
            if (!Migrate::IsValidLegacy($legacy)) continue;
            $version = Migrate::CleanVersion($legacy['version_info']['version']);
            if (isset($existing[$version])) continue;

            [$main, $mirrors] = Migrate::ParseDownloads($legacy);
            $list[] = [
                "ID" => $legacy['version_info']['id'],
                "Version" => $version,
                "Name" => $legacy['version_info']['name'],
                "Release_Date" => date("Y-m-d", $legacy['version_info']['release']),
                "Archiver" => $legacy['archive_info']['archiver'],
                "Group" => $legacy['archive_info']['group'],
                "Screenshots" => count($legacy['screenshots'] ?? []),
                "File" => $main,
                "File_Is_Zip" => $main != null && str_ends_with(strtolower($main), ".zip"),
            ];
        }

        return new Response(true, "Success", $list);
    }

    // eclipse groups were hardcoded, 1 stable 2 lazer
    static function FindGroup($legacyGroup)
    {
        $name = "stable";
        if ($legacyGroup == 2) $name = "lazer";

        $group = Connection::execSelect("SELECT ID FROM Snapshots_Groups WHERE LOWER(Group_Name) = ?", "s", [$name]);
        if (count($group) > 0) return $group[0]['ID'];

        $group = Connection::execSimpleSelect("SELECT ID FROM Snapshots_Groups ORDER BY `Order` ASC LIMIT 1");
        if (count($group) > 0) return $group[0]['ID'];
        return null;
    }

    static function VideoID($video)
    {
        if ($video == null || $video == "") return "";
        if (preg_match('~(?:embed/|v=|youtu\.be/)([A-Za-z0-9_-]{6,64})~', $video, $matches)) {
            return $matches[1];
        }
        return "";
    }

    // same as Eclipse.Profiles transferComments + transferCommentVotes, but just for one version
    static function MigrateComments($legacyId, $id)
    {
        $eclipse = new \Database\BaseConnection(ETI_DATABASE_HOSTNAME, ETI_DATABASE_USERNAME, ETI_DATABASE_PASSWORD, ETI_DATABASE_NAME);

        // ascending so parents always go in before their replies
        $comments = $eclipse->execSelect("SELECT * FROM Comments WHERE VersionID = ? ORDER BY ID ASC", "i", [$legacyId]);
        if (count($comments) == 0) return 0;

        // eclipse ids can clash with comments made on inex, so shift them all past the current highest id
        $offset = (int)Connection::execSimpleSelect("SELECT COALESCE(MAX(ID), 0) AS Max_ID FROM Common_Comments")[0]['Max_ID'];

        $commentIds = [];
        foreach ($comments as $comment) {
            $parent = null;
            if (!empty($comment['ParentComment'])) {
                $parent = $comment['ParentComment'] + $offset;
            }
            $commentIds[$comment['ID']] = $comment['ID'] + $offset;

            Connection::execOperation(
                "INSERT INTO Common_Comments (ID, Target_ID, Target_Table, User_ID, Parent_Comment_ID, Text, Date, Is_Pinned) VALUES (?, ?, 'Snapshots_Versions', ?, ?, ?, ?, ?)",
                "iiiissi",
                [$comment['ID'] + $offset, $id, $comment['UserID'], $parent, $comment['PostText'], $comment['PostDate'], $comment['Pinned'] ?? 0]
            );
        }

        // type 0 is beatmaps, everything else is comments
        $placeholders = implode(",", array_fill(0, count($commentIds), "?"));
        $votes = $eclipse->execSelect(
            "SELECT * FROM Votes WHERE Type <> 0 AND ObjectID IN ($placeholders)",
            str_repeat("i", count($commentIds)),
            array_keys($commentIds)
        );

        $seen = [];
        foreach ($votes as $vote) {
            $commentId = $commentIds[$vote['ObjectID']];
            $key = $commentId . "|" . $vote['UserID'];
            if (isset($seen[$key])) continue;
            $seen[$key] = true;

            Connection::execOperation("INSERT INTO Common_Votes (Target_ID, Target_Table, User_ID) VALUES (?, 'Common_Comments', ?)", "ii", [$commentId, $vote['UserID']]);
        }

        return count($comments);
    }

    // extra info lives inside the description now, as a <solution-note extra>
    static function Description($legacy)
    {
        $description = trim($legacy['archive_info']['description'] ?? "");
        $extra = trim($legacy['archive_info']['extra_info'] ?? "");
        if ($extra != "") {
            if ($description != "") $description .= "\n\n";
            $description .= "<solution-note extra>" . $extra . "</solution-note>";
        }
        return $description;
    }

    public static function Migrate($legacyId): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.migrate")) return new Response(false, "You can't do that");
        if (!is_numeric($legacyId)) return new Response(false, "Invalid version");

        set_time_limit(0);

        $legacyAll = Migrate::GetLegacyAll();
        if ($legacyAll == null) return new Response(false, "Couldn't reach eclipse");

        $legacy = null;
        foreach ($legacyAll as $l) {
            if (!Migrate::IsValidLegacy($l)) continue;
            if ($l['version_info']['id'] == $legacyId) {
                $legacy = $l;
            }
        }
        if ($legacy == null) return new Response(false, "Couldn't find that version on eclipse");

        $archiverId = intval($legacy['archive_info']['archiver_id'] ?? 0);
        if ($archiverId == 0) $archiverId = "";

        // create, same as the admin form
        $created = Versions::Create([
            "Version" => Migrate::CleanVersion($legacy['version_info']['version']),
            "Release_Date" => date("Y-m-d", $legacy['version_info']['release']),
            "Group_ID" => Migrate::FindGroup($legacy['archive_info']['group'] ?? 1),
            "Flag_Auto_Updates" => $legacy['archive_info']['auto_update'] ? 1 : 0,
            "Flag_Requires_Server" => ($legacy['archive_info']['requires_supporter'] ?? false) ? 1 : 0,
            "Meta_Name" => $legacy['version_info']['name'],
            "Meta_Archiver_ID" => $archiverId,
            // copied as-is, admins clean it up before publishing
            "Meta_Description" => Migrate::Description($legacy),
            "Meta_Extra_Info" => "",
            "Meta_Video" => Migrate::VideoID($legacy['archive_info']['video'] ?? ""),
        ]);
        if (!$created->success) return $created;
        $id = $created->content['ID'];

        // things the normal flow doesn't touch
        $archivalDate = $legacy['archive_info']['upload_date'] ?? null;
        Connection::execOperation(
            "UPDATE Snapshots_Versions SET Analytics_Views = ?, Analytics_Downloads = ?, Meta_Archival_Date = COALESCE(?, Meta_Archival_Date) WHERE ID = ?",
            "iisi",
            [intval($legacy['stats']['views'] ?? 0), intval($legacy['stats']['downloads'] ?? 0), $archivalDate, $id]
        );

        [$main, $mirrors] = Migrate::ParseDownloads($legacy);

        $errors = [];
        foreach ($mirrors as $mirror) {
            $resp = Mirrors::Add($id, $mirror['Name'], $mirror['URL']);
            if (!$resp->success) $errors[] = "Mirror " . $mirror['Name'] . ": " . $resp->message;
        }

        foreach ($legacy['screenshots'] ?? [] as $screenshot) {
            $path = Migrate::TempPath($screenshot);
            if (!Migrate::DownloadTo(Migrate::ScreenshotUrl($legacy, $screenshot), $path)) {
                $errors[] = "Screenshot " . $screenshot . ": couldn't download";
                continue;
            }
            $resp = Screenshots::Add($id, $path, "");
            if (!$resp->success) $errors[] = "Screenshot " . $screenshot . ": " . $resp->message;
            if (file_exists($path)) unlink($path);
        }

        try {
            Migrate::MigrateComments($legacyId, $id);
        } catch (\Throwable $e) {
            $errors[] = "Comments: couldn't copy them from eclipse's database (" . $e->getMessage() . ")";
        }

        // only zips come over, anything else the admin has to re-archive themselves
        $legacyFile = null;
        if ($main != null && str_ends_with(strtolower($main), ".zip")) {
            $path = Migrate::TempPath($legacy['version_info']['version'] . ".zip");
            if (Migrate::DownloadTo($main, $path)) {
                $resp = Versions::UploadFile($id, $path);
                if (!$resp->success) $errors[] = "File: " . $resp->message;
            } else {
                $errors[] = "File: couldn't download";
                $legacyFile = $main;
            }
            if (file_exists($path)) unlink($path);
        } else if ($main != null) {
            $legacyFile = $main;
        }

        return new Response(true, "Migrated", [
            "ID" => $id,
            "LegacyFile" => $legacyFile,
            "Errors" => $errors,
        ]);
    }
}
