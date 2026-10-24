<?php

namespace Data\Archive;

use API\Response;
use AWS\S3;
use Data\OsekaiUsers;
use Data\Archive;
use Database\Connection;
use Database\Session;
use Image\GetImage;
use Image\Transform;

class Screenshots
{
    const THUMB_HEIGHT = 480;

    // what staff can pick from when tagging a screenshot
    const GAME_SCREENS = [
        "Main Menu",
        "Main Menu Opened",
        "Settings Menu",
        "Song Select",
        "Gameplay",
        "Score Results",
        "Editor",
        "Multiplayer Lobby",
        "Other",
    ];

    public static function GameScreens(): Response
    {
        return new Response(true, "Success", Screenshots::GAME_SCREENS);
    }

    static function ValidateGameScreen($gameScreen)
    {
        if ($gameScreen === "" || $gameScreen === null) return [null, null];
        if (!in_array($gameScreen, Screenshots::GAME_SCREENS)) return ["Invalid game screen", null];
        return [null, $gameScreen];
    }

    public static function DeleteFiles($screenshot)
    {
        S3::deleteFile(GetImage::ArchiveScreenshotObject("full", $screenshot, true));
        S3::deleteFile(GetImage::ArchiveScreenshotObject("thumb", $screenshot, true));
    }

    // $_file is either an uploaded file or a local path (migrations use paths), same as anthera's ItemImages::Create
    public static function Add($versionId, $_file, $gameScreen): Response
    {
        if (is_string($_file)) {
            $file = [
                "tmp_name" => $_file,
                "name" => basename($_file),
                "error" => UPLOAD_ERR_OK
            ];
        } else {
            $file = $_file;
        }

        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.screenshots")) return new Response(false, "You can't do that");
        if (!is_numeric($versionId)) return new Response(false, "Invalid version");

        $version = Connection::execSelect("SELECT ID FROM Snapshots_Versions WHERE ID = ?", "i", [$versionId]);
        if (count($version) == 0) return new Response(false, "Version not found");

        [$error, $gameScreen] = Screenshots::ValidateGameScreen($gameScreen);
        if ($error !== null) return new Response(false, $error);

        if (!isset($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return new Response(false, "Upload failed", $file['error'] ?? null);

        // from anthera's ItemImages::Create
        $fileInfo = getimagesize($file["tmp_name"]);
        if ($fileInfo === false) return new Response(false, "Invalid Image File");

        $mimeType = $fileInfo['mime'];
        $allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!in_array($mimeType, $allowedMimeTypes)) return new Response(false, "incorrect_format");

        $image = imagecreatefromstring(file_get_contents($file["tmp_name"]));
        if ($image === false) return new Response(false, "Invalid Image File");
        $width = imagesx($image);
        $height = imagesy($image);

        // new ones go on the end
        $order = 0;
        $last = Connection::execSelect("SELECT MAX(`Order`) AS Last FROM Snapshots_Versions_Screenshots WHERE Version_ID = ?", "i", [$versionId]);
        if (count($last) > 0 && $last[0]['Last'] !== null) {
            $order = $last[0]['Last'] + 1;
        }

        Connection::execOperation(
            "INSERT INTO Snapshots_Versions_Screenshots (Version_ID, Width, Height, Game_Screen, `Order`) VALUES (?, ?, ?, ?, ?)",
            "iiisi",
            [$versionId, $width, $height, $gameScreen, $order]
        );
        $id = Connection::getConnection()->insert_id;
        $screenshot = ["ID" => $id, "Version_ID" => (int)$versionId];

        $full = Transform::ImageToPng($image);
        $thumb = Transform::ImageToPng(Transform::Resize($image, Screenshots::THUMB_HEIGHT, "height"));

        S3::uploadFile($full, GetImage::ArchiveScreenshotObject("full", $screenshot, true), "image/png");
        S3::uploadFile($thumb, GetImage::ArchiveScreenshotObject("thumb", $screenshot, true), "image/png");

        return Archive::Get($versionId);
    }

    public static function Edit($id, $gameScreen): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.screenshots")) return new Response(false, "You can't do that");
        if (!is_numeric($id)) return new Response(false, "Invalid screenshot");

        $screenshot = Connection::execSelect("SELECT * FROM Snapshots_Versions_Screenshots WHERE ID = ?", "i", [$id]);
        if (count($screenshot) == 0) return new Response(false, "Screenshot not found");

        [$error, $gameScreen] = Screenshots::ValidateGameScreen($gameScreen);
        if ($error !== null) return new Response(false, $error);

        Connection::execOperation("UPDATE Snapshots_Versions_Screenshots SET Game_Screen = ? WHERE ID = ?", "si", [$gameScreen, $id]);

        return Archive::Get($screenshot[0]['Version_ID']);
    }

    // $ids is every screenshot id for the version, in the new order
    public static function Reorder($versionId, $ids): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.screenshots")) return new Response(false, "You can't do that");
        if (!is_numeric($versionId)) return new Response(false, "Invalid version");
        if (!is_array($ids)) return new Response(false, "Invalid order");

        $order = 0;
        foreach ($ids as $id) {
            if (!is_numeric($id)) continue;
            Connection::execOperation("UPDATE Snapshots_Versions_Screenshots SET `Order` = ? WHERE ID = ? AND Version_ID = ?", "iii", [$order, $id, $versionId]);
            $order++;
        }

        return Archive::Get($versionId);
    }

    public static function Remove($id): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.version.screenshots")) return new Response(false, "You can't do that");
        if (!is_numeric($id)) return new Response(false, "Invalid screenshot");

        $screenshot = Connection::execSelect("SELECT * FROM Snapshots_Versions_Screenshots WHERE ID = ?", "i", [$id]);
        if (count($screenshot) == 0) return new Response(false, "Screenshot not found");
        $screenshot = $screenshot[0];

        Screenshots::DeleteFiles($screenshot);
        Connection::execOperation("DELETE FROM Snapshots_Versions_Screenshots WHERE ID = ?", "i", [$id]);

        return Archive::Get($screenshot['Version_ID']);
    }
}
