<?php

namespace Data\Profiles;

use API\Response;
use Data\Profiles;
use Database\Connection;

class Banners
{
    public static BannerThemeParser $themeParser;

    public static function GetBanner($id)
    {
        $data = Connection::execSelect("SELECT * FROM Profiles_Banners WHERE ID = ?", "i", [$id]);
        if (count($data) == 0) return null;
        $data = $data[0];

        $theme = Connection::execSelect("SELECT * FROM Profiles_Banners_Themes WHERE `Key` = ?", "s", [$data['Theme_Key']])[0];
        $userData = Profiles::Get($data['User_ID'])->content;
        $data['User'] = $userData;
        $data['Theme'] = $theme;

        $data['Theme']['Settings'] = json_decode($data['Theme']['Settings'], true);
        $data['Settings'] = json_decode($data['Settings'], true);
        if ($data['Settings'] == "" || count($data['Settings']) == 0) $data['Settings'] = (object)[];

        return new Response(true, "ok", $data);
    }
}