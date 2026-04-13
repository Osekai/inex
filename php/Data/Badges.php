<?php

namespace Data;

use API\Response;
use Database\Connection;

class Badges
{

    public static function GetAll()
    {
        $db = Connection::execSimpleSelect("
SELECT Badges_Data.*, 
    JSON_ARRAYAGG(
        DISTINCT JSON_OBJECT(
            'User_ID', Badges_Users.User_ID,
            'Date_Awarded', Badges_Users.Date_Awarded,
            'Username', Merged_Users_Deduped.Name
        )
    ) AS Users,
    MIN(Badges_Users.Date_Awarded) AS First_Date_Awarded,
    Badges_Users.Description AS Description
FROM Badges_Data 
        LEFT JOIN Badges_Users ON Badges_Data.ID = Badges_Users.Badge_ID
        LEFT JOIN (
            SELECT User_ID, MIN(Name) AS Name
            FROM Merged_Users
            GROUP BY User_ID
        ) Merged_Users_Deduped ON Merged_Users_Deduped.User_ID = Badges_Users.User_ID
GROUP BY Badges_Data.ID
ORDER BY First_Date_Awarded DESC
        ");

        foreach($db as &$i) {
            $i['Users'] = json_decode($i['Users'], true);
            $i['Name'] = str_replace(" ", "_", $i['Name']);
            $i['RealName'] = basename($i['Image_URL']);
        }


        return new Response(true, "ok", $db);
    }

    public static function GetOne(mixed $name)
    {
        // this is incredibly dumb but i didnt wanna copy/paste the query
        $all = self::GetAll();
        if($all->success) {
            foreach($all->content as $badge) {
                if($badge['Name'] == $name) return $badge;
            }
        }
        return null;
    }
}