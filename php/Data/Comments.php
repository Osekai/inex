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

    public static function Get(mixed $id, mixed $table)
    {
        $valid_tables = ["Medals_Data"];
        if (!in_array($table, $valid_tables)) return new Response(false, "invalid_table");

        if ($table == "Medals_Data") {
            if (Medals::Get($id) == null) return new Response(false, "invalid_id");
        }

        return new Response(
            true,
            "ok",
            Connection::execSelect("SELECT * FROM Common_Comments WHERE Target_ID = ? AND Target_Table = ? AND Parent_Comment_ID IS NULL", "is", [$id, $table]));
    }
}