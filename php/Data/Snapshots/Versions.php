<?php

namespace Data\Snapshots;

use API\Response;
use AWS\S3;
use Data\OsekaiUsers;
use Data\Snapshots;
use Database\Connection;
use Database\Session;

class Versions
{
    // osu! came out in 2007, nothing can be earlier than that
    const EARLIEST_DATE = "2007-01-01";

    // turns checkbox-y values into 1/0
    static function Flag($value)
    {
        if ($value === true || $value === 1 || $value === "1" || $value === "true" || $value === "on") {
            return 1;
        }
        return 0;
    }

    // shared checks for create + edit, returns [error, cleaned data]
    static function Validate($data)
    {
        $version = trim($data['Version'] ?? "");
        // ends up in the s3 path, so keep it boring
        if (!preg_match('/^[A-Za-z0-9._-]{1,64}$/', $version)) return ["Invalid version (letters, numbers, dots, dashes and underscores only)", null];

        $releaseDate = $data['Release_Date'] ?? "";
        $parsed = \DateTime::createFromFormat("Y-m-d", $releaseDate);
        if ($parsed === false || $parsed->format("Y-m-d") !== $releaseDate) return ["Invalid release date", null];
        if ($releaseDate < Versions::EARLIEST_DATE) return ["Release date is too far back", null];

        $groupId = $data['Group_ID'] ?? "";
        if (!is_numeric($groupId)) return ["Invalid group", null];
        $group = Connection::execSelect("SELECT ID FROM Snapshots_Groups WHERE ID = ?", "i", [$groupId]);
        if (count($group) == 0) return ["Invalid group", null];

        $archiverId = $data['Meta_Archiver_ID'] ?? "";
        if ($archiverId === "") $archiverId = null;
        if ($archiverId !== null && !is_numeric($archiverId)) return ["Invalid archiver ID", null];

        $video = trim($data['Meta_Video'] ?? "");
        if ($video === "") $video = null;
        if ($video !== null && !preg_match('/^[A-Za-z0-9_-]{6,64}$/', $video)) return ["Invalid video (just the YouTube video ID)", null];

        $name = trim($data['Meta_Name'] ?? "");
        if ($name === "") $name = null;
        if ($name !== null && mb_strlen($name) > 128) return ["Name is too long (128 characters max)", null];

        $description = trim($data['Meta_Description'] ?? "");
        if ($description === "") $description = null;

        $extraInfo = trim($data['Meta_Extra_Info'] ?? "");
        if ($extraInfo === "") $extraInfo = null;

        return [null, [
            "Version" => $version,
            "Release_Date" => $releaseDate,
            "Group_ID" => (int)$groupId,
            "Flag_Auto_Updates" => Versions::Flag($data['Flag_Auto_Updates'] ?? 0),
            "Flag_Requires_Server" => Versions::Flag($data['Flag_Requires_Server'] ?? 0),
            "Meta_Name" => $name,
            "Meta_Archiver_ID" => $archiverId,
            "Meta_Description" => $description,
            "Meta_Extra_Info" => $extraInfo,
            "Meta_Video" => $video,
        ]];
    }

    public static function Create($data): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.create")) return new Response(false, "You can't do that");

        [$error, $clean] = Versions::Validate($data);
        if ($error !== null) return new Response(false, $error);

        $existing = Connection::execSelect("SELECT ID FROM Snapshots_Versions WHERE Version = ?", "s", [$clean['Version']]);
        if (count($existing) > 0) return new Response(false, "That version already exists");

        Connection::execOperation(
            "INSERT INTO Snapshots_Versions (Version, Release_Date, Group_ID, Flag_Auto_Updates, Flag_Requires_Server, Meta_Name, Meta_Archival_Date, Meta_Archiver_ID, Meta_Description, Meta_Extra_Info, Meta_Video)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)",
            "ssiiisisss",
            [$clean['Version'], $clean['Release_Date'], $clean['Group_ID'], $clean['Flag_Auto_Updates'], $clean['Flag_Requires_Server'], $clean['Meta_Name'], $clean['Meta_Archiver_ID'], $clean['Meta_Description'], $clean['Meta_Extra_Info'], $clean['Meta_Video']]
        );
        $id = Connection::getConnection()->insert_id;

        return Snapshots::Get($id);
    }

    public static function Edit($id, $data): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.edit")) return new Response(false, "You can't do that");
        if (!is_numeric($id)) return new Response(false, "Invalid version");

        $current = Connection::execSelect("SELECT * FROM Snapshots_Versions WHERE ID = ?", "i", [$id]);
        if (count($current) == 0) return new Response(false, "Version not found");
        $current = $current[0];

        [$error, $clean] = Versions::Validate($data);
        if ($error !== null) return new Response(false, $error);

        $existing = Connection::execSelect("SELECT ID FROM Snapshots_Versions WHERE Version = ? AND ID != ?", "si", [$clean['Version'], $id]);
        if (count($existing) > 0) return new Response(false, "That version already exists");

        // the download is named after the version, so it has to move with it
        if ($current['Version'] !== $clean['Version'] && $current['File_Format'] != null) {
            $oldPath = Snapshots::DownloadPath($current);
            $newPath = Snapshots::DownloadPath(["ID" => $id, "Version" => $clean['Version']]);
            if (S3::fileExists($oldPath)) {
                S3::copyFile($oldPath, $newPath);
                S3::deleteFile($oldPath);
            }
        }

        Connection::execOperation(
            "UPDATE Snapshots_Versions SET Version = ?, Release_Date = ?, Group_ID = ?, Flag_Auto_Updates = ?, Flag_Requires_Server = ?, Meta_Name = ?, Meta_Archiver_ID = ?, Meta_Description = ?, Meta_Extra_Info = ?, Meta_Video = ? WHERE ID = ?",
            "ssiiisisssi",
            [$clean['Version'], $clean['Release_Date'], $clean['Group_ID'], $clean['Flag_Auto_Updates'], $clean['Flag_Requires_Server'], $clean['Meta_Name'], $clean['Meta_Archiver_ID'], $clean['Meta_Description'], $clean['Meta_Extra_Info'], $clean['Meta_Video'], $id]
        );

        return Snapshots::Get($id);
    }

    // $_file is either an uploaded file or a local path (migrations use paths), same as anthera's ItemImages::Create
    public static function UploadFile($id, $_file): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.upload")) return new Response(false, "You can't do that");
        if (!is_numeric($id)) return new Response(false, "Invalid version");

        if (is_string($_file)) {
            $file = [
                "tmp_name" => $_file,
                "name" => basename($_file),
                "error" => UPLOAD_ERR_OK
            ];
        } else {
            $file = $_file;
        }

        $version = Connection::execSelect("SELECT * FROM Snapshots_Versions WHERE ID = ?", "i", [$id]);
        if (count($version) == 0) return new Response(false, "Version not found");
        $version = $version[0];

        if (!isset($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return new Response(false, "Upload failed", $file['error'] ?? null);
        if (strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) !== "zip") return new Response(false, "Versions have to be uploaded as a .zip");

        $size = filesize($file['tmp_name']);

        // stream it so a 200mb client doesn't end up in memory
        $stream = fopen($file['tmp_name'], "rb");
        S3::uploadFile($stream, Snapshots::DownloadPath($version, "zip"), "application/zip");
        if (is_resource($stream)) fclose($stream);

        Connection::execOperation("UPDATE Snapshots_Versions SET File_Format = ?, File_Size = ? WHERE ID = ?", "sii", ["zip", $size, $id]);

        return Snapshots::Get($id);
    }

    public static function Publish($id, $published): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.publish")) return new Response(false, "You can't do that");
        if (!is_numeric($id)) return new Response(false, "Invalid version");

        $published = Versions::Flag($published);
        Connection::execOperation("UPDATE Snapshots_Versions SET Published = ? WHERE ID = ?", "ii", [$published, $id]);

        return Snapshots::Get($id);
    }

    public static function Delete($id): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.delete")) return new Response(false, "You can't do that");
        if (!is_numeric($id)) return new Response(false, "Invalid version");

        $version = Connection::execSelect("SELECT * FROM Snapshots_Versions WHERE ID = ?", "i", [$id]);
        if (count($version) == 0) return new Response(false, "Version not found");
        $version = $version[0];

        // done file by file, S3::deleteFolder bails on anything over 10 items
        $screenshots = Connection::execSelect("SELECT * FROM Snapshots_Versions_Screenshots WHERE Version_ID = ?", "i", [$id]);
        foreach ($screenshots as $screenshot) {
            Screenshots::DeleteFiles($screenshot);
        }
        if ($version['File_Format'] != null) {
            S3::deleteFile(Snapshots::DownloadPath($version));
        }

        // votes first, they're found through the comments (same as Eclipse.Profiles)
        Connection::execOperation("DELETE FROM Common_Votes WHERE Target_Table = 'Common_Comments' AND Target_ID IN (SELECT ID FROM Common_Comments WHERE Target_Table = 'Snapshots_Versions' AND Target_ID = ?)", "i", [$id]);
        Connection::execOperation("DELETE FROM Common_Comments WHERE Target_Table = 'Snapshots_Versions' AND Target_ID = ?", "i", [$id]);
        Connection::execOperation("DELETE FROM Snapshots_Versions_Screenshots WHERE Version_ID = ?", "i", [$id]);
        Connection::execOperation("DELETE FROM Snapshots_Versions_Download_Mirrors WHERE Version_ID = ?", "i", [$id]);
        Connection::execOperation("DELETE FROM Snapshots_Versions WHERE ID = ?", "i", [$id]);

        return new Response(true, "Deleted");
    }
}
