<?php

namespace Data;

use API\Osu\User;
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

        // optional extra conditions passed in via options
        if (!empty($options['extra_conditions']) && is_array($options['extra_conditions'])) {
            foreach ($options['extra_conditions'] as $condition) {
                $whereClause .= " AND $condition";
            }
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
                $sql = "SELECT * FROM Medals_Data ORDER BY Frequency";
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
                $whereClause .= " AND Count_Replays_Watched >= 1";
                $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY Count_Replays_Watched DESC";
                break;

            case "mapsets":
                if (!isset($options['type'])) return ["error" => "No 'type' specified - must be 'ranked' or 'loved'"];
                $order = $options['type'] === "ranked" ? "Count_Maps_Ranked" : "Count_Maps_Loved";
                $whereClause .= " AND $order >= 1";
                $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY $order DESC";
                break;

            case "subscribers":
                $whereClause .= " AND Count_Subscribers >= 1";
                $sql = "SELECT * FROM Rankings_Users $whereClause ORDER BY Count_Subscribers DESC";
                break;

            case "badges":
                $whereClause .= " AND Count_Badges >= 1";
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

        // parse search parameters
        $searchQuery = isset($options['query']) ? $options['query'] : null;
        $searchColumn = null;
        $searchParams = [];
        $searchTypes = "";

        if ($searchQuery !== null && isset($options['queryColumn'])) {
            $searchColumns = [
                "Username" => "Name",
                "User ID" => "ID",
                "Country" => "Country_Code"
            ];

            if ($rankingType === "medals_users") {
                $searchColumns["Rarest Medal"] = "Medal_Data";
                $searchColumns["Medal Name"] = "Medal_Data";
            }

            if (isset($searchColumns[$options['queryColumn']])) {
                $searchColumn = $searchColumns[$options['queryColumn']];
            }
        }

        // extract ORDER BY clause and clean it
        $orderByClause = "";
        if (preg_match('/ORDER BY (.+?)(?:LIMIT|$)/is', $result['sql'], $matches)) {
            $orderByPart = trim($matches[1]);
            $orderByPart = preg_replace('/\b\w+\./', '', $orderByPart);
            $orderByClause = $orderByPart;
        }

        // build search WHERE clause
        $searchWhereClause = "";
        if ($searchQuery !== null && $searchColumn !== null) {
            $useExactMatch = ($options['queryColumn'] === "User ID");

            if ($searchColumn === "Medal_Data") {
                $searchWhereClause = "WHERE JSON_UNQUOTE(JSON_EXTRACT(Medal_Data, '$.Name')) LIKE ?";
                $searchParams[] = "%$searchQuery%";
                $searchTypes .= "s";
            } else if ($useExactMatch) {
                $searchWhereClause = "WHERE $searchColumn = ?";
                $searchParams[] = $searchQuery;
                $searchTypes .= is_numeric($searchQuery) ? "i" : "s";
            } else if ($searchColumn === "Country_Code") {
                $searchWhereClause = "WHERE UPPER(Country_Code) = UPPER(?) OR Country_Code IN (SELECT Country_Code FROM Common_Countries WHERE Name LIKE ?)";
                array_push($searchParams, $searchQuery, "$searchQuery%");
                $searchTypes .= "ss";
            } else {
                $searchWhereClause = "WHERE $searchColumn LIKE ?";
                $searchParams[] = "%$searchQuery%";
                $searchTypes .= "s";
            }
        }

        // build main query with ROW_NUMBER for ranking
        $rankedSQL = "
            SELECT 
                ROW_NUMBER() OVER (ORDER BY $orderByClause) AS Rank,
                ranked.*
            FROM (
                " . $result['sql'] . "
            ) AS ranked";

        if ($searchWhereClause) {
            $rankedSQL = "
                SELECT * FROM (
                    $rankedSQL
                ) AS ranked_data
                $searchWhereClause AND ranked_data.Rank < 10000";
        } else {
            $rankedSQL = "
        SELECT * FROM (
            $rankedSQL
        ) AS ranked_data
        WHERE ranked_data.Rank < 10000
    ";
        }

        $rankedSQL .= "
            ORDER BY Rank ASC
            LIMIT ? OFFSET ?";

        $allParams = array_merge($result['params'], $searchParams, [$limit, $offset]);
        $allTypes = $result['types'] . $searchTypes . "ii";

        $data = Connection::execSelect($rankedSQL, $allTypes, $allParams);

        // build count query
        $countSQL = "SELECT COUNT(*) as count FROM (" . $result['sql'] . ") AS ranked_data";

        if ($searchWhereClause) {
            $countSQL .= " " . $searchWhereClause;
        }

        $countParams = array_merge($result['params'], $searchParams);
        $countTypes = $result['types'] . $searchTypes;
        if ($rankingType === "medals_rarity" || $rankingType === "mapsets" || $rankingType === "replays" || $rankingType === "subscribers" || $rankingType === "badges") {
            $totalCount = Connection::execSelect($countSQL, $countTypes, $countParams)[0]['count'] ?? 0;
        } else {
            $totalCount = 10000;
        }
        if($totalCount > 10000) $totalCount = 10000;

        // parse JSON fields
        foreach ($data as &$row) {
            if (isset($row['Medal_Data'])) {
                $row['Medal_Data'] = json_decode($row['Medal_Data'], true);
            }
        }

        return new Response(true, "ok", ["data" => $data, "max" => $totalCount]);
    }

    public static function AddUser(mixed $id)
    {
        $user = User::GetUser($id);
        $id = $user['id'];
        if($user == null) return new Response(false, "User not found");
        $exists = Connection::execSelect("SELECT * FROM Rankings_Users WHERE ID = ?", "i", [$id]);
        if(count($exists) > 0) return new Response(false, "User already exists");
        Connection::execOperation("INSERT INTO Rankings_Users (ID) VALUES (?)", "i", [$id]);
        return new Response(true, "ok");
    }
}