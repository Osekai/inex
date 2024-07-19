<?php

namespace Data;

use API\Response;
use Database\Connection;

class Medals
{
    static function GetAll(): Response
    {
        return new Response(true, "Success", Connection::execSimpleSelect("
        SELECT *, Medals_Data.Medal_ID as Medal_ID FROM Medals_Data 
        LEFT JOIN Medals_Configuration ON Medals_Data.Medal_ID = Medals_Configuration.Medal_ID
        ", "medals", 60));
    }

    public static function Save($id, $data)
    {
        return new Response(true, "Success", Connection::execOperation("
        UPDATE medals_configuration
        SET Solution = ?, Is_Solution_Found = ?, Video_URL = ?, Is_Lazer = ?, Is_Restricted = ?, Date_Released = ?, First_Achieved_Date = ?, First_Achieved_User_ID = ?
        WHERE Medal_ID = ?
        ", "sisiissii", [$data['Solution'], $data['Is_Solution_Found'], $data['Video_URL'], $data['Is_Lazer'], $data['Is_Restricted'], $data['Date_Released'], $Data['First_Achieved_Date'], $Data['First_Achieved_User_ID'], $_Data['Medal_ID']]));
    }
}