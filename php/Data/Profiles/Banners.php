<?php

namespace Data\Profiles;

use Ampra\IO;
use API\Response;
use Data\Profiles;
use Database\Connection;
use Database\Session;
use Site;

class Banners
{
    public static BannerThemeParser $themeParser;

    // "" means the user's main mode, null if it isn't a mode at all
    public static function NormaliseGamemode($gamemode)
    {
        if ($gamemode === null) return "";
        if ($gamemode === "catch") return "fruits";
        if (in_array($gamemode, ["", "osu", "taiko", "fruits", "mania"], true)) return $gamemode;
        return null;
    }

    public static function GetBanner($id)
    {
        $data = Connection::execSelect("SELECT * FROM Profiles_Banners WHERE ID = ?", "i", [$id]);
        if (count($data) == 0) return null;
        $data = $data[0];

        $theme = Connection::execSelect("SELECT * FROM Profiles_Banners_Themes WHERE `Key` = ?", "s", [$data['Theme_Key']])[0];
        $userData = Profiles::Get($data['User_ID'], $data['Gamemode'] ?? "")->content;
        $data['User'] = $userData;
        $data['Theme'] = $theme;

        $data['Theme']['Settings'] = json_decode($data['Theme']['Settings'], true);
        $data['Settings'] = json_decode($data['Settings'], true);
        if ($data['Settings'] == "" || count($data['Settings']) == 0) $data['Settings'] = (object)[];

        return new Response(true, "ok", $data);
    }

    static function RenderBanner($id, $userCheck = null) {
        if($id == 0 && $userCheck !== null) {
            // return user's only first banner
            $banners = Connection::execSelect("SELECT ID FROM Profiles_Banners WHERE User_ID = ?", "i", [$userCheck]);
            if (count($banners) == 0) return new Response(false, "not found");
            $id = $banners[0]['ID'];
        }
        $bannerData = Banners::GetBanner($id);
        if ($bannerData === null) return new Response(false, "not found");
        if($userCheck !== null) {
            if($bannerData->content['User_ID'] != $userCheck) return new Response(false, "not found");
        }
        return Banners::RenderBannerData($bannerData);
    }

    // the hidden "404" theme, shown by the /html route when there's no banner
    static function RenderNotFound() {
        $theme = Connection::execSelect("SELECT * FROM Profiles_Banners_Themes WHERE `Key` = ?", "s", ["404"]);
        if (count($theme) == 0) return "404 theme missing";
        $theme = $theme[0];
        $theme['Settings'] = json_decode($theme['Settings'], true);

        $data = [
            "ID" => null,
            "User_ID" => 0,
            "Name" => "Not found",
            "Theme_Key" => $theme['Key'],
            "Settings" => (object)[],
            "Gamemode" => "",
            // the renderer reads these, there's no real user here
            "User" => [
                "User" => ["id" => 0, "playmode" => "osu"],
                "Statistics" => ["Medals" => ["Percentage" => 0]],
            ],
            "Theme" => $theme,
        ];

        return Banners::RenderBannerData(new Response(true, "ok", $data));
    }

    // renders a theme for the logged in user, settings come from ?override like anthera's me pages
    static function RenderPreview($key) {
        if (!Session::LoggedIn()) return "not logged in";

        $theme = Connection::execSelect("SELECT * FROM Profiles_Banners_Themes WHERE `Key` = ?", "s", [$key]);
        if (count($theme) == 0) return "unknown theme?";
        $theme = $theme[0];
        $theme['Settings'] = json_decode($theme['Settings'], true);

        $settings = (object)[];
        $gamemode = "";
        if (isset($_GET['override'])) {
            $override = json_decode(urldecode(base64_decode($_GET['override'])), true);

            $time = $override['time']; // current time in milliseconds

            // convert milliseconds to seconds
            $time = intval($time / 1000);

            // check if the time is within the last 10 seconds (just in case people have shit internets)
            if (time() - $time > 10) {
                return "Request too old. Please remove 'override' query from URL";
            }

            if (isset($override['Settings']) && is_array($override['Settings'])) {
                $settings = $override['Settings'];
            }

            $gamemode = self::NormaliseGamemode($override['Gamemode'] ?? "");
            if ($gamemode === null) $gamemode = "";
        }

        $userId = Session::UserData()['id'];
        $data = [
            "ID" => null,
            "User_ID" => $userId,
            "Name" => "Preview",
            "Theme_Key" => $theme['Key'],
            "Settings" => $settings,
            "Gamemode" => $gamemode,
            "User" => Profiles::Get($userId, $gamemode)->content,
            "Theme" => $theme,
        ];

        return Banners::RenderBannerData(new Response(true, "ok", $data));
    }

    static function RenderBannerData($bannerData) {
        Site::$profiles_banner = $bannerData;

        Banners::$themeParser = new \Data\Profiles\BannerThemeParser();
        foreach ($bannerData->content['Theme']['Settings'] as $key => &$value) {
            Banners::$themeParser->Parse($key, $value, $bannerData->content['Settings']);
        }
        unset($value);

        // the stats are already fetched for the banner's mode, but the api always reports
        // User.playmode as the user's default one. so the mode being shown lives in its own field
        $mode = $bannerData->content['Gamemode'] ?? "";
        if ($mode === "") {
            $mode = $bannerData->content['User']['User']['playmode'];
        }
        $bannerData->content['Mode'] = $mode;

        // the icon font and the .gamemode-* classes call fruits "catch"
        $modeKey = $mode;
        if ($modeKey === "fruits") $modeKey = "catch";

        // we don't like the template rendering since it's old and doesn't let us do our fuckery so we do it ourselves

        $qu = $bannerData->content['User'];
        $elements = [
            "pb-pfp" => <<< HTML
 <img src="https://a.ppy.sh/{$qu['User']['id']}" class="pb-pfp">
HTML,
            "pb-gamemode-icon" => <<< HTML
<i class="icon-gamemode-{$modeKey}"></i>
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
        // no rendering here, the frontend iframes /profiles/banner/{id}/html instead
        $data = Connection::execSelect("SELECT * FROM Profiles_Banners WHERE User_ID = ?", "i", [$id]);
        foreach ($data as &$d) {
            $theme = Connection::execSelect("SELECT * FROM Profiles_Banners_Themes WHERE `Key` = ?", "s", [$d['Theme_Key']])[0];
            $theme['Settings'] = json_decode($theme['Settings'], true);
            $d['Theme'] = $theme;

            $d['Settings'] = json_decode($d['Settings'], true);
            if ($d['Settings'] == "" || count($d['Settings']) == 0) $d['Settings'] = (object)[];
        }
        return new Response(true, "ok", $data);
    }

    static function GetTheme($key)
    {
        $theme = Connection::execSelect("SELECT * FROM Profiles_Banners_Themes WHERE `Key` = ? AND Hidden = 0", "s", [$key]);
        if (count($theme) == 0) return null;
        $theme = $theme[0];
        $theme['Settings'] = json_decode($theme['Settings'], true);
        return $theme;
    }

    public static function Create($themeKey)
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!\Data\OsekaiUsers::HasPermission("profiles.banners.edit", true)) return new Response(false, "You can't do that");
        $userId = Session::UserData()['id'];

        $theme = self::GetTheme($themeKey);
        if ($theme === null) return new Response(false, "invalid_theme_key");

        Connection::execOperation("INSERT INTO Profiles_Banners (User_ID, Name, Theme_Key, Settings) VALUES (?, ?, ?, '{}')",
            "iss", [$userId, $theme['Name'], $theme['Key']]);
        $id = Connection::getConnection()->insert_id;
        IO::Send("/banner/" . $userId . "/" . $id . "/invalidate", [], "imagepier");

        return new Response(true, "ok", ["ID" => $id]);
    }

    public static function Delete($id)
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!\Data\OsekaiUsers::HasPermission("profiles.banners.edit", true)) return new Response(false, "You can't do that");
        $userId = Session::UserData()['id'];

        if (!is_numeric($id)) return new Response(false, "Invalid banner");

        Connection::execOperation("DELETE FROM Profiles_Banners WHERE ID = ? AND User_ID = ?", "ii", [$id, $userId]);
        IO::Send("/banner/" . $userId . "/" . $id . "/invalidate", [], "imagepier");

        return new Response(true, "ok");
    }

    // ported from anthera (php/Data/Me.php, Me::Save)
    public static function Save($id, $data)
    {
        if (!Session::LoggedIn()) return new Response(false, "Not logged in");
        if (!\Data\OsekaiUsers::HasPermission("profiles.banners.edit", true)) return new Response(false, "You can't do that");
        $userId = Session::UserData()['id'];

        if (!is_array($data)) return new Response(false, "Invalid data");

        $item = Connection::execSelect("SELECT * FROM Profiles_Banners WHERE ID = ? AND User_ID = ?", "ii", [$id, $userId]);
        if (count($item) == 0) return new Response(false, "Not yours");

        $theme = self::GetTheme($data['Theme_Key'] ?? "");
        if ($theme === null) return new Response(false, "invalid_theme_key");

        $gamemode = self::NormaliseGamemode($data['Gamemode'] ?? "");
        if ($gamemode === null) return new Response(false, "invalid_gamemode");

        $name = trim($data['Name'] ?? "");
        if ($name == "") $name = $theme['Name'];
        $name = mb_substr($name, 0, 128);

        $settingErrors = [];

        $themeSettings = [];
        foreach (($data['Settings'] ?? []) as $key => $setting) {
            // check if the setting actually exists in the key
            $themesetting = null;
            foreach ($theme['Settings'] as $tkey => $tvalue) {
                if ($tkey === $key) $themesetting = $tvalue;
            }
            if ($themesetting == null) {
                $settingErrors[] = "Setting " . $key . " does not exist";
                continue;
            } // best to assume they switched theme and that setting does not exist anymore!

            // gradients are the only thing allowed to be an array
            if ($themesetting['type'] == "colour-gradient") {
                if (!is_array($setting) || count($setting) == 0) {
                    $settingErrors[] = "Setting " . $key . " is not a valid gradient";
                    continue;
                }
                $colours = [];
                $valid = true;
                foreach ($setting as $colour) {
                    if (!is_string($colour) || !preg_match('/^#[0-9a-fA-F]{6}$/', $colour)) {
                        $valid = false;
                        break;
                    }
                    $colours[] = strtolower($colour);
                }
                if (!$valid) {
                    $settingErrors[] = "Setting " . $key . " is not a valid gradient";
                    continue;
                }
                $themeSettings[$key] = $colours;
                continue;
            }

            // check if $setting is a string or number (not object)
            if (is_array($setting)) {
                return new Response(false, "invalid_theme_settings");
            }

            $type = is_string($setting) ? "string" : "number";

            if ($themesetting['type'] == "colour-picker") {
                // hex validation happens before the generic string sanitizer below,
                // since that strips the leading # from any hex value
                if ($type !== "string" || !preg_match('/^#[0-9a-fA-F]{6}$/', $setting)) {
                    $settingErrors[] = "Setting " . $key . " is not a valid hex colour (" . $setting . ")";
                    continue;
                }
                $themeSettings[$key] = strtolower($setting);
                continue;
            }

            if ($type == "string") {
                $setting = preg_replace('/[^a-zA-Z0-9\s\-]/', '', $setting);
            } else {
                $setting = is_numeric($setting) ? $setting + 0 : 0;
            }

            if (($themesetting['type'] == "range" || $themesetting['type'] == "color-hue") && $type !== "number") {
                $settingErrors[] = "Setting " . $key . " should be a number. It is not. (" . $setting . ")";
                continue;
            }

            if ($themesetting['type'] == "enum") {
                // make sure it's a valid
                $valid = false;
                foreach ($themesetting['values'] as $k) {
                    if ($k['key'] === $setting) {
                        $valid = true;
                    }
                }
                if (!$valid) {
                    $settingErrors[] = "Setting " . $key . " is not a valid enum (" . $setting . ")";
                    continue;
                } // best to pretend everything's ok
            }

            if ($themesetting['type'] == "color-hue") $setting = max(0, min(360, $setting));

            if ($themesetting['type'] == "range" && ($setting < $themesetting['values']['start'] || $setting > $themesetting['values']['end'])) {
                $settingErrors[] = "Setting " . $key . " is outside of valid range (" . $setting . ")";
                continue;
            }

            $themeSettings[$key] = $setting;
        }

        Connection::execOperation("UPDATE Profiles_Banners SET Name = ?, Theme_Key = ?, Settings = ?, Gamemode = ? WHERE ID = ? AND User_ID = ?",
            "ssssii", [$name, $theme['Key'], json_encode((object)$themeSettings), $gamemode, $id, $userId]);

        IO::Send("/banner/" . $userId . "/" . $id . "/invalidate", [], "imagepier");

        return new Response(true, "ok", $settingErrors);
    }

    public static function AllThemes()
    {
        $data = Connection::execSimpleSelect("SELECT * FROM Profiles_Banners_Themes WHERE Hidden = 0");
        foreach ($data as &$d) {
            $d['Settings'] = json_decode($d['Settings'], true);
        }
        return new Response(true, "ok", $data);
    }
}