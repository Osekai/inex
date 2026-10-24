<?php

namespace Data\Archive;

use API\Response;
use Data\Archive;
use Data\OsekaiUsers;
use Database\Connection;
use Database\Session;
use Image\GetImage;

// staff picked versions for the homepage carousel, each one runs until its end date
class Featured
{
    // how many screenshots the homepage card shows (one big, two small)
    const SCREENSHOTS = 3;

    public static function GetActive(): Response
    {
        $features = Connection::execSimpleSelect("
            SELECT f.ID, f.Version_ID, f.Description, f.End_Date,
                   v.Version, v.Meta_Name, v.Release_Date, v.Meta_Archiver_ID, u.Name AS Archiver_Name
            FROM Snapshots_Featured f
            JOIN Snapshots_Versions v ON v.ID = f.Version_ID
            LEFT JOIN Rankings_Users u ON u.ID = v.Meta_Archiver_ID
            WHERE f.End_Date >= NOW() AND v.Published = 1
            ORDER BY f.Created_At DESC
        ");

        foreach ($features as &$feature) {
            $screenshots = Connection::execSelect(
                "SELECT * FROM Snapshots_Versions_Screenshots WHERE Version_ID = ? ORDER BY `Order` ASC LIMIT " . Featured::SCREENSHOTS,
                "i",
                [$feature['Version_ID']]
            );
            $feature['Screenshots'] = [];
            foreach ($screenshots as $screenshot) {
                $feature['Screenshots'][] = [
                    "Thumb" => GetImage::ArchiveScreenshotObject("thumb", $screenshot),
                    "Full" => GetImage::ArchiveScreenshotObject("full", $screenshot),
                    "Game_Screen" => $screenshot['Game_Screen'],
                ];
            }
        }
        unset($feature);

        return new Response(true, "Success", $features);
    }

    public static function GetAll(): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.featured")) return new Response(false, "You can't do that");

        $features = Connection::execSimpleSelect("
            SELECT f.*, v.Version, v.Meta_Name, u.Name AS Created_By_Name,
                   (f.End_Date >= NOW()) AS Active
            FROM Snapshots_Featured f
            LEFT JOIN Snapshots_Versions v ON v.ID = f.Version_ID
            LEFT JOIN Rankings_Users u ON u.ID = f.Created_By
            ORDER BY f.End_Date DESC
        ");

        return new Response(true, "Success", $features);
    }

    public static function Create($versionId, $description, $endDate): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.featured")) return new Response(false, "You can't do that");
        if (!is_numeric($versionId)) return new Response(false, "Pick a version to feature");

        $version = Connection::execSelect("SELECT ID FROM Snapshots_Versions WHERE ID = ?", "i", [$versionId]);
        if (count($version) == 0) return new Response(false, "Version not found");

        $description = trim($description);
        if ($description == "") return new Response(false, "Write something about why it's cool!");

        $parsed = \DateTime::createFromFormat("Y-m-d", $endDate);
        if ($parsed === false || $parsed->format("Y-m-d") !== $endDate) return new Response(false, "Invalid end date");
        if ($endDate < date("Y-m-d")) return new Response(false, "End date can't be in the past");

        // runs until the end of that day
        Connection::execOperation(
            "INSERT INTO Snapshots_Featured (Version_ID, Description, End_Date, Created_By) VALUES (?, ?, ?, ?)",
            "issi",
            [$versionId, $description, $endDate . " 23:59:59", Session::UserData()['id']]
        );

        return Featured::GetAll();
    }

    public static function Delete($id): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.featured")) return new Response(false, "You can't do that");
        if (!is_numeric($id)) return new Response(false, "Invalid feature");

        Connection::execOperation("DELETE FROM Snapshots_Featured WHERE ID = ?", "i", [$id]);

        return Featured::GetAll();
    }
}
