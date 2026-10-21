<?php

namespace Data\Profiles;

use API\Response;
use Database\Connection;
use Database\Session;

class Visits
{
    // the same person refreshing a profile shouldn't count over and over
    const COOLDOWN_MINUTES = 30;

    public static function Record($userId): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!\Data\OsekaiUsers::HasPermission("profiles.visits.record", true)) return new Response(false, "You can't do that");
        $visitorId = Session::UserData()['id'];

        if (!is_numeric($userId)) return new Response(false, "Invalid user");
        if ($userId == $visitorId) return new Response(true, "Own profile, not counted");

        $recent = Connection::execSelect("SELECT ID FROM Profiles_Visits
            WHERE Visitor_User_ID = ? AND Visited_User_ID = ? AND Date > DATE_SUB(NOW(), INTERVAL ? MINUTE)", "iii", [$visitorId, $userId, Visits::COOLDOWN_MINUTES]);
        if (count($recent) > 0) return new Response(true, "Already counted");

        Connection::execOperation("INSERT INTO Profiles_Visits (Visitor_User_ID, Visited_User_ID, Date) VALUES (?, ?, NOW())", "ii", [$visitorId, $userId]);
        return new Response(true, "Success");
    }

    // days = only count visits in the last x days, null for all time
    public static function MostVisited($limit = 10, $days = null): Response
    {
        if ($days !== null && is_numeric($days)) {
            $rows = Connection::execSelect("SELECT v.Visited_User_ID AS User_ID, r.Name, COUNT(*) AS Visits FROM Profiles_Visits v
                LEFT JOIN Rankings_Users r ON r.ID = v.Visited_User_ID
                WHERE v.Date > DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY v.Visited_User_ID, r.Name
                ORDER BY Visits DESC LIMIT ?", "ii", [$days, $limit], "profiles_most_visited_" . $days . "_" . $limit, 300);
            return new Response(true, "Success", $rows);
        }

        $rows = Connection::execSelect("SELECT v.Visited_User_ID AS User_ID, r.Name, COUNT(*) AS Visits FROM Profiles_Visits v
            LEFT JOIN Rankings_Users r ON r.ID = v.Visited_User_ID
            GROUP BY v.Visited_User_ID, r.Name
            ORDER BY Visits DESC LIMIT ?", "i", [$limit], "profiles_most_visited_all_" . $limit, 300);
        return new Response(true, "Success", $rows);
    }

    public static function RecentlyVisited($limit = 10): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        $visitorId = Session::UserData()['id'];

        $rows = Connection::execSelect("SELECT v.Visited_User_ID AS User_ID, r.Name, MAX(v.Date) AS Last_Visited, UNIX_TIMESTAMP(MAX(v.Date)) AS Last_Visited_Unix FROM Profiles_Visits v
            LEFT JOIN Rankings_Users r ON r.ID = v.Visited_User_ID
            WHERE v.Visitor_User_ID = ?
            GROUP BY v.Visited_User_ID, r.Name
            ORDER BY Last_Visited DESC LIMIT ?", "ii", [$visitorId, $limit]);
        return new Response(true, "Success", $rows);
    }
}
