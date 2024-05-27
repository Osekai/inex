<?php

namespace Data;

use API\Response;
use Database\Connection;

class Medals
{
    static function GetAll(): Response
    {
        return new Response(true, "Success", Connection::execSimpleSelect("SELECT * FROM Medals_Data LEFT JOIN Medals_Configuration ON Medals_Data.Medal_ID = Medals_Configuration.Medal_ID", "medals", 60));
    }
}