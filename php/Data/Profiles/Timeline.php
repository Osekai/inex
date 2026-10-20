<?php

namespace Data\Profiles;

use API\Response;
use Database\Connection;
use Database\Session;

class Timeline
{
    public static function Get($userId): Response
    {
        $entries = Connection::execSelect("SELECT * FROM Profiles_Timeline WHERE User_ID = ? ORDER BY Date ASC", "i", [$userId]);
        return new Response(true, "Success", $entries);
    }

    // shared checks for add + edit, returns an error message or null
    static function Validate($date, $note)
    {
        $parsed = \DateTime::createFromFormat("Y-m-d", $date);
        if ($parsed === false || $parsed->format("Y-m-d") !== $date) return "Invalid date";
        if ($parsed > new \DateTime()) return "Date can't be in the future";

        $note = trim($note);
        if ($note == "") return "Note can't be empty";
        if (mb_strlen($note) > 500) return "Note is too long (500 characters max)";

        return null;
    }

    public static function Add($date, $note, $mode): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        $userId = Session::UserData()['id'];

        $error = Timeline::Validate($date, $note);
        if ($error !== null) return new Response(false, $error);

        // empty mode means it's not tied to one
        if ($mode == "fruits") $mode = "catch";
        if ($mode == "") $mode = null;
        if ($mode !== null && !in_array($mode, ["osu", "taiko", "catch", "mania"])) return new Response(false, "Invalid gamemode");

        $existing = Connection::execSelect("SELECT ID FROM Profiles_Timeline WHERE User_ID = ? AND Date = ? AND Note = ? AND Mode <=> ?", "isss", [$userId, $date, trim($note), $mode]);
        if (count($existing) > 0) return new Response(false, "You already have this timeline point");

        Connection::execOperation("INSERT INTO Profiles_Timeline (User_ID, Date, Note, Mode) VALUES (?, ?, ?, ?)", "isss", [$userId, $date, trim($note), $mode]);

        return Timeline::Get($userId);
    }

    public static function Edit($id, $date, $note): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        $userId = Session::UserData()['id'];

        if (!is_numeric($id)) return new Response(false, "Invalid timeline point");

        $error = Timeline::Validate($date, $note);
        if ($error !== null) return new Response(false, $error);

        Connection::execOperation("UPDATE Profiles_Timeline SET Date = ?, Note = ? WHERE ID = ? AND User_ID = ?", "ssii", [$date, trim($note), $id, $userId]);

        return Timeline::Get($userId);
    }

    public static function Delete($id): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        $userId = Session::UserData()['id'];

        if (!is_numeric($id)) return new Response(false, "Invalid timeline point");

        Connection::execOperation("DELETE FROM Profiles_Timeline WHERE ID = ? AND User_ID = ?", "ii", [$id, $userId]);

        return Timeline::Get($userId);
    }
}
