<?php

namespace Data\Snapshots;

use API\Response;
use Data\OsekaiUsers;
use Database\Connection;
use Database\Session;

class Submissions
{
    const STATUS_PENDING = 0;
    const STATUS_ACCEPTED = 1;
    const STATUS_DENIED = 2;

    const MAX_PENDING = 25; // first release will get lots of people submitting!

    // anyone logged in can submit, blockable through a role's Blocked_Permissions
    public static function Submit($title, $description, $link): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.submit", true)) return new Response(false, "You can't do that");
        $userId = Session::UserData()['id'];

        $title = trim($title);
        $description = trim($description);
        $link = trim($link);

        if ($title == "") return new Response(false, "Please give it a name");
        if (mb_strlen($title) > 255) return new Response(false, "Name is too long (255 characters max)");
        if (mb_strlen($description) > 2000) return new Response(false, "Description is too long (2000 characters max)");
        if (!filter_var($link, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//', $link)) return new Response(false, "Please give a valid link to the download");
        if (strlen($link) > 512) return new Response(false, "Link is too long (512 characters max)");
        if ($description == "") $description = null;

        // stops people flooding the queue
        $pending = Connection::execSelect("SELECT COUNT(*) AS Count FROM Snapshots_Submissions WHERE User_ID = ? AND Status = ?", "ii", [$userId, Submissions::STATUS_PENDING]);
        if ($pending[0]['Count'] >= Submissions::MAX_PENDING) return new Response(false, "You already have " . Submissions::MAX_PENDING . " submissions waiting, please wait for those to be looked at first");

        Connection::execOperation("INSERT INTO Snapshots_Submissions (User_ID, Title, Description, Link) VALUES (?, ?, ?, ?)", "isss", [$userId, $title, $description, $link]);

        return new Response(true, "Submitted");
    }

    public static function GetAll(): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.submissions")) return new Response(false, "You can't do that");

        $submissions = Connection::execSimpleSelect("
            SELECT s.*, u.Name AS Username
            FROM Snapshots_Submissions s
            LEFT JOIN Rankings_Users u ON u.ID = s.User_ID
            ORDER BY s.Status ASC, s.Date DESC
        ");

        return new Response(true, "Success", $submissions);
    }

    public static function SetStatus($id, $status): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!OsekaiUsers::HasPermission("snapshots.admin.submissions")) return new Response(false, "You can't do that");
        if (!is_numeric($id)) return new Response(false, "Invalid submission");
        if (!in_array((int)$status, [Submissions::STATUS_PENDING, Submissions::STATUS_ACCEPTED, Submissions::STATUS_DENIED], true)) return new Response(false, "Invalid status");

        Connection::execOperation("UPDATE Snapshots_Submissions SET Status = ? WHERE ID = ?", "ii", [(int)$status, $id]);

        return Submissions::GetAll();
    }
}
