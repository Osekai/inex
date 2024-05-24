<?php
namespace Data {

    use API\Response;
    use Database;


    class Settings
    {
        private static $settings = null;
        public static function Get($id = null)
        {
            if (is_null($id)) {
                if(Database\Session::LoggedIn()) {
                    $id = Database\Session::UserData()['ID'];
                } else {
                    return [];
                }
            }
            if (isset(self::$settings[$id])) {
                return self::$settings[$id];
            }

            $resp = Database\Connection::execSelect("SELECT * FROM System_Users_Settings WHERE User_ID = ?", "i", [$id]);
            if (count($resp) > 0) {
                self::$settings[$id] = json_decode($resp[0]["Settings"], true);
                return json_decode($resp[0]["Settings"], true);
            }
            return null;
        }

        public static function ApiSet($key, $value) {
            $oldsettings = self::Get();

            $oldsettings[$key] = $value;

            Database\Connection::execOperation('UPDATE System_Users_Settings SET Settings = ? WHERE User_ID = ?', "si", [json_encode($oldsettings), Database\Session::UserData()['ID']]);
            return new Response(true);
        }
        public static function GetSetting($settingname, $default) {
            if(isset(self::Get()[$settingname])) {
                return self::Get()[$settingname];
            }
            return $default;
        }
    }

}