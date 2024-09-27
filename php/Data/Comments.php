<?php

namespace Data;

use API\Response;
use Database\Connection;
use Database\Session;


class Comments
{
    public static function Post(mixed $id, mixed $table, mixed $text, $replyingTo = null)
    {
        $valid_tables = ["Medals_Data"];
        if (!in_array($table, $valid_tables)) return new Response(false, "invalid_table");

        if (\CheckTargetValidity::Check($table, $id) == null) return new Response(false, "invalid_id");

        Connection::execOperation("INSERT INTO `Common_Comments` (`Target_ID`, `Target_Table`, `User_ID`, `Parent_Comment_ID`, `Text`, `Date`, `Is_Pinned`)
VALUES (?, ?, ?, ?, ?, now(), '0');", "isiis", [$id, $table, Session::UserData()['id'], $replyingTo, $text]);

        return new Response(true, "", self::Get($id, $table, $replyingTo, $text)->content[0]);
    }

    public static function GetOne($id) {
        $comment = Connection::execSelect("SELECT * FROM Common_Comments WHERE ID = ?", "i", [$id]);
        if(count($comment) > 0) return $comment[0];
        return null;
    }

    public static function Get(mixed $id, mixed $table, $parent = null, $single = null)
    {
        $valid_tables = ["Medals_Data"];
        if (!in_array($table, $valid_tables)) return new Response(false, "invalid_table");

        if (\CheckTargetValidity::Check($table, $id) == null) return new Response(false, "invalid_id");

        $types = "is";
        $values = [$id, $table];


        if ($single !== null) {
            $types .= "s";
            $values[] = $single;
        }
        if($parent != null) {
            $types .= "i";
            $values[] = $parent;
        }

        if (Session::LoggedIn()) {
            $types = "i" . $types; // Add the type for user ID
            array_unshift($values, Session::UserData()['id']); // Add the user ID to the beginning of $values
        }

        $query = "
SELECT Common_Comments.*, COUNT(Children.ID) as Replies,  COUNT(DISTINCT Common_Votes.User_ID) AS VoteCount" .
            (Session::LoggedIn() ? ", (SELECT COUNT(Common_Votes.User_ID) 
 FROM Common_Votes 
 WHERE Common_Votes.User_ID = ? 
 AND Common_Votes.Target_Table = 'Common_Comments' 
 AND Common_Votes.Target_ID = Common_Comments.ID) AS HasVoted " : "") .
            "FROM Common_Comments 
 LEFT JOIN Common_Comments AS Children ON Children.Parent_Comment_ID = Common_Comments.ID
 LEFT JOIN Common_Votes ON Common_Votes.Target_Table = 'Common_Comments' AND Common_Votes.Target_ID = Common_Comments.ID
 WHERE Common_Comments.Target_ID = ? 
 AND Common_Comments.Target_Table = ? " . ($single == null ? "" : "AND Common_Comments.Text = ? ") .
 "AND Common_Comments.Parent_Comment_ID " . ($parent == null ? "IS NULL" : "= ?") . " 
 GROUP BY Common_Comments.ID 
 ORDER BY Is_Pinned, VoteCount, Replies DESC";

        return new Response(true, "ok", Connection::execSelect($query, $types, $values));
    }
}