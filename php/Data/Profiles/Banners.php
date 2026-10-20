<?php

namespace Data\Profiles;

use API\Response;
use Data\Profiles;
use Database\Connection;
use Site;

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

    static function RenderBanner($id) {
        $bannerData = Banners::GetBanner($id);
        if ($bannerData === null) return "unknown banner?";
        Site::$profiles_banner = $bannerData;

        Banners::$themeParser = new \Data\Profiles\BannerThemeParser();
        foreach ($bannerData->content['Theme']['Settings'] as $key => &$value) {
            Banners::$themeParser->Parse($key, $value, $bannerData->content['Settings']);
        }
        unset($value);

        // we don't like the template rendering since it's old and doesn't let us do our fuckery so we do it ourselves

        $qu = $bannerData->content['User'];
        $elements = [
            "pb-pfp" => <<< HTML
 <img src="https://a.ppy.sh/{$qu['User']['id']}" class="pb-pfp">
HTML,
            "pb-gamemode-icon" => <<< HTML
<i class="icon-gamemode-{$qu['User']['playmode']}"></i>
HTML,
            "pb-medals-completion-bar" => <<< HTML
<div class="medals-completion-bar">
<div class="bar" style="width: {$qu["Statistics"]["Medals"]["Percentage"]}%"></div>
</div>
HTML
        ];


        ob_start();
        include "frontend/profiles-banners/" . $bannerData->content['Theme']['Key'] . "/" . $bannerData->content['Theme']['Key'] . ".php";
        $page = ob_get_contents();
        ob_end_clean();

        foreach ($elements as $key => $value) {
            $page = str_replace("<$key></$key>", $value, $page);
        }

        ob_start();
        include "templates/profiles_banner.php";
        $page = ob_get_contents();
        ob_end_clean();
        return [
            "html" => $page,
            "data" => $bannerData->content,
        ];
    }

    public static function GetUserBanners($id)
    {
        $data = Connection::execSelect("SELECT * FROM Profiles_Banners WHERE User_ID = ?", "i", [$id]);
        foreach ($data as &$d) {
            $d = Banners::RenderBanner($d['ID']);
            unset($d['data']['User']);
        }
        return new Response(true, "ok", $data);
    }

    public static function AllThemes()
    {
        $data = Connection::execSimpleSelect("SELECT * FROM Profiles_Banners_Themes");
        foreach ($data as &$d) {
            $d['Settings'] = json_decode($d['Settings'], true);
        }
        return new Response(true, "ok", $data);
    }
}