<?php

namespace Data;

use API\Response;
use Database\Connection;

class Rankings
{
    static function GenerateSQL($rankingType, $options)
    {
        $whereClause = "";
        $params = [];
        $paramTypes = "";

        // handle dynamic where conditions
        if (!empty($options['where']) && is_array($options['where'])) {
            $conditions = [];
            foreach ($options['where'] as $col => $val) {
                $conditions[] = "$col = ?";
                $params[] = $val;
                $paramTypes .= is_int($val) ? "i" : "s";
            }
            $whereClause = "WHERE " . implode(" AND ", $conditions);
        } else {
            $whereClause = "WHERE Rankings_Users.Is_Restricted = 0";
        }

        $sql = "";

        switch ($rankingType) {
            case "medals_users":
                $sql = "
SELECT 
    Rankings_Users.*,
    JSON_OBJECT(
        'Medal_ID', Medals_Data.Medal_ID,
        'Name', Medals_Data.Name,
        'Link', Medals_Data.Link,
        'Frequency', Medals_Data.Frequency,
        'Count_Achieved_By', Medals_Data.Count_Achieved_By
    ) AS Medal_Data,
    ROUND((Rankings_Users.Count_Medals / TotalMedals.Total_Count) * 100, 2) AS Medal_Percentage
FROM Rankings_Users
LEFT JOIN Medals_Data 
    ON Medals_Data.Medal_ID = Rankings_Users.Rarest_Medal_ID
CROSS JOIN (
    SELECT COUNT(*) AS Total_Count FROM Medals_Data
) AS TotalMedals
$whereClause
ORDER BY Rankings_Users.Count_Medals DESC";
                break;

            case "medals_rarity":
                $sql = "SELECT * FROM Medals_Data ORDER BY Frequency DESC";
                break;

            case "pp":
                if (!isset($options['type'])) return ["error" => "No 'type' specified - must be 'total' or 'stdev'"];
                $order = $options['type'] === "total" ? "PP_Total" : "PP_Stdev";
                $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY $order DESC";
                break;

            case "level":
                if (!isset($options['type'])) return ["error" => "No 'type' specified - must be 'total' or 'stdev'"];
                if ($options['type'] === "total") {
                    $sql = "SELECT *, (Level_Catch + Level_Mania + Level_Taiko + Level_Standard) AS Level_Total FROM Rankings_Users $whereClause ORDER BY Level_Total DESC";
                } else {
                    $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY Level_Stdev DESC";
                }
                break;

            case "accuracy":
                if (!isset($options['type'])) return ["error" => "No 'type' specified - must be 'total' or 'stdev'"];
                if ($options['type'] === "total") {
                    $sql = "SELECT *, (Accuracy_Catch + Accuracy_Mania + Accuracy_Taiko + Accuracy_Standard) AS Accuracy_Total FROM Rankings_Users $whereClause ORDER BY Accuracy_Total DESC";
                } else {
                    $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY Accuracy_Stdev DESC";
                }
                break;

            case "replays":
                $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY Count_Replays_Watched";
                break;

            case "mapsets":
                if (!isset($options['type'])) return ["error" => "No 'type' specified - must be 'ranked' or 'loved'"];
                $order = $options['type'] === "ranked" ? "Count_Maps_Ranked" : "Count_Maps_Loved";
                $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY $order DESC";
                break;

            case "subscribers":
                $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY Count_Subscribers DESC";
                break;

            case "badges":
                $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY Count_Badges DESC";
                break;

            default:
                return ["error" => "No ranking type specified for " . $rankingType];
        }

        return ['sql' => $sql, 'types' => $paramTypes, 'params' => $params];
    }

    static function GetRanking($rankingType, $options, $limit = 50, $offset = 0)
    {
        $result = self::GenerateSQL($rankingType, $options);
        if (isset($result['error'])) return new Response(false, $result['error']);

        $sql = $result['sql'] . " LIMIT ? OFFSET ?";
        $types = $result['types'] . "ii";
        $params = array_merge($result['params'], [$limit, $offset]);

        $data = Connection::execSelect($sql, $types, $params);

        $countWhere = !empty($options['where']) ? $result['params'] : [];
        $countQuery = "SELECT COUNT(*) as count FROM Rankings_Users " . (!empty($options['where']) ? "WHERE " . implode(" AND ", array_map(fn($k) => "$k = ?", array_keys($options['where']))) : "WHERE Rankings_Users.Is_Restricted = 0");
        $totalCount = Connection::execSelect($countQuery, $result['types'], $countWhere)[0]['count'] ?? 0;

        foreach ($data as $i => &$row) {
            $row['Rank'] = $offset + $i + 1;
            if (isset($row['Medal_Data'])) $row['Medal_Data'] = json_decode($row['Medal_Data'], true);
        }

        return new Response(true, "ok", ["data" => $data, "max" => $totalCount]);
    }
}
