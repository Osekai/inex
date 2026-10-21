<?php

namespace Data\Profiles;

use API\Response;
use Database\Connection;
use Database\Session;

class Bio
{
    const MAX_LENGTH = 10000;

    // raw markdown, empty string when they haven't written one
    public static function Get($userId)
    {
        $row = Connection::execSelect("SELECT Bio FROM Profiles_Data WHERE User_ID = ?", "i", [$userId]);
        if (count($row) == 0) return "";
        return $row[0]['Bio'] ?? "";
    }

    public static function Render($markdown)
    {
        if ($markdown == "") return "";
        return \Markdown::Parse($markdown, true);
    }

    public static function Set($bio): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!\Data\OsekaiUsers::HasPermission("profiles.bio.edit", true)) return new Response(false, "You can't do that");
        $userId = Session::UserData()['id'];

        if (!is_string($bio)) return new Response(false, "Invalid bio");
        $bio = trim($bio);
        if (mb_strlen($bio) > self::MAX_LENGTH) return new Response(false, "Your bio can be at most " . self::MAX_LENGTH . " characters");

        $previous = self::Get($userId);

        // empty clears it
        if ($bio == "") $bio = null;

        Connection::execOperation("INSERT INTO Profiles_Data (User_ID, Bio) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE Bio = VALUES(Bio)", "is", [$userId, $bio]);

        // only worth posting when there's something new to read
        if ($bio !== null && $bio !== $previous) {
            \Ampra\IO::Send("/profile-bio", [
                "user" => Session::UserData(),
                "bio" => $bio,
                "url" => "/profiles/" . $userId
            ]);
        }

        return new Response(true, "Success", [
            "Bio" => $bio ?? "",
            "Bio_Html" => self::Render($bio ?? "")
        ]);
    }
}
