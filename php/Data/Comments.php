<?php

namespace Data;

use API\Response;
use Database\Connection;


class Comments
{
    public static function Post(mixed $id, mixed $table, mixed $text)
    {
        $valid_tables = ["Medals_Data"];
        if (!in_array($table, $valid_tables)) return new Response(false, "invalid_table");

        if ($table == "Medals_Data") {
            if (Medals::Get($id) == null) return new Response(false, "invalid_id");
        }
    }

    public static function Get(mixed $id, mixed $table, $parent = null)
    {
        $valid_tables = ["Medals_Data"];
        if (!in_array($table, $valid_tables)) return new Response(false, "invalid_table");

        if ($table == "Medals_Data") {
            $medal = Medals::Get($id);
            if ($medal == null) return new Response(false, "invalid_id");
        }

        $types = "is";
        $values = [$id, $table];

        if($parent != null) {
            $types .= "i";
            $values[] = $parent;
        }

        return new Response(
            true,
            "ok",
            Connection::execSelect("
SELECT Common_Comments.*, COUNT(Children.ID) as Replies FROM Common_Comments 
         LEFT JOIN Common_Comments AS Children ON Children.Parent_Comment_ID = Common_Comments.ID
         WHERE Common_Comments.Target_ID = ? AND Common_Comments.Target_Table = ? AND Common_Comments.Parent_Comment_ID " . ($parent == null ? "IS NULL" : "= ?") . " 
         GROUP BY Common_Comments.ID ORDER BY Is_Pinned, Replies DESC", $types, $values));
    }
}