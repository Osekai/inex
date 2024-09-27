<?php

namespace Data;

use API\Response;
use Database\Connection;
use Database\Session;

class Votes
{

    public static function Vote($target, $id)
    {
        if (\CheckTargetValidity::Check($target, $id) == null) return new Response(false, "invalid_id");


        $exists = Connection::execSelect("SELECT * FROM Common_Votes WHERE Target_ID = ? AND Target_Table = ? AND User_ID = ?", "isi", [$id, $target, Session::UserData()['id']]);

        if(count($exists) > 0) {
            Connection::execOperation("DELETE FROM `Common_Votes` WHERE Target_ID = ? AND Target_Table = ? AND User_ID = ?;", "isi", [$id, $target, Session::UserData()['id']]);
            return new Response(true, "vote_remove", "vote_remove");
        } else {
            Connection::execOperation("INSERT INTO `Common_Votes` (`Target_ID`, `Target_Table`, `User_ID`)
VALUES (?, ?, ?);", "isi", [$id, $target, Session::UserData()['id']]);
            return new Response(true, "vote_add", "vote_add");
        }
    }
}