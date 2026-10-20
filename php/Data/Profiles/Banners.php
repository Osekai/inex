<?php

namespace Data\Profiles;

use API\Response;
use Data\Profiles;
use Database\Connection;

class Banners
{

    public static function GetBanner($id)
    {
        $data = Connection::execSelect("SELECT * FROM Profiles_Banners WHERE ID = ?", "i", [$id])[0];
        $theme = Connection::execSelect("SELECT * FROM Profiles_Banners_Themes WHERE `Key` = ?", "s", [$data['Theme_Key']])[0];
        $userData = Profiles::Get($data['User_ID'])->content;
        $data['User'] = $userData;
        $data['Theme'] = $theme;

        $data['Theme']['Options'] = json_decode($data['Theme']['Options'], true);
        $data['Options'] = json_decode($data['Options'], true);

        return new Response(true, "ok", $data);
    }
}