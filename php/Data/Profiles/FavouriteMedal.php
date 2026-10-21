<?php

namespace Data\Profiles;

use API\Response;
use Database\Connection;
use Database\Session;

class FavouriteMedal
{
    // medal id or null
    public static function Get($userId)
    {
        $row = Connection::execSelect("SELECT Favourite_Medal FROM Profiles_Data WHERE User_ID = ?", "i", [$userId]);
        if (count($row) == 0) return null;
        return $row[0]['Favourite_Medal'];
    }

    public static function Set($medalId): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!\Data\OsekaiUsers::HasPermission("profiles.favourite.edit", true)) return new Response(false, "You can't do that");
        $userId = Session::UserData()['id'];

        if (!is_numeric($medalId)) return new Response(false, "Invalid medal");

        // has to be one they actually have
        $user = \Data\Profiles::Get($userId)->content['User'];
        $obtained = false;
        foreach ($user['user_achievements'] as $achievement) {
            if ($achievement['achievement_id'] == $medalId) {
                $obtained = true;
            }
        }
        if (!$obtained) return new Response(false, "You don't have that medal");

        Connection::execOperation("INSERT INTO Profiles_Data (User_ID, Favourite_Medal) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE Favourite_Medal = VALUES(Favourite_Medal)", "ii", [$userId, $medalId]);

        return new Response(true, "Success", (int)$medalId);
    }
}
