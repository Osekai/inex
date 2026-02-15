<?php
namespace Database {

    use Data;
    use Database;
    use General;
    use API;

    class Session
    {
        private static $session = null;
        private $userdata = null;
        private $settings = null;
        private $key = null;
        private function __construct()
        {
            if ($_COOKIE["session"] != null || $this->key != null) {
                $this->key = $_COOKIE["session"];
                $userid = Database\Connection::execSelect("SELECT * FROM `System_Sessions` WHERE `Key` = ?", "s", [$this->key]);
                if (count($userid) > 0) {
                    $userid = $userid[0]["User_ID"];
                } else {
                    setcookie("session", "", -1);
                    return;
                }

                $this->userdata = Data\OsekaiUsers::GetUser($userid, true);
                $this->settings = Data\Settings::Get($userid);
            }
        }

        public static function Begin()
        {
            if (self::$session == null) {
                self::$session = new Session();
            }
        }
        public static function generateRandomString($length = 10)
        {
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);
            $randomString = '';
            for ($i = 0; $i < $length; $i++) {
                $randomString .= $characters[random_int(0, $charactersLength - 1)];
            }
            return $randomString;
        }

        public static function Login($user_id)
        {
            $session_key = self::generateRandomString(64);
            Database\Connection::execOperation("INSERT INTO `System_Sessions` (`Key`, `User_ID`) VALUES (?, ?) ", "si", [$session_key, $user_id]);
            setcookie("session", $session_key, strtotime("2038-01-19 03:14:07"));
        }
        public static function LoginRedirect($rd = false) {
            setcookie("last_path", $_SERVER['REQUEST_URI'], time() + (5000), "/"); // 86400 = 1 day
            if($rd) General::Redirect("/login");
        }
        public static function LoggedIn()
        {
            if (self::$session->userdata == null) {
                return false;
            } else {
                return true;
            }
        }
        public static function UserData()
        {
            if (self::$session->userdata == null) {
                return null;
            }
            return self::$session->userdata;
        }

        public static function Logout()
        {
            setcookie("session", null, strtotime("2018-01-19 03:14:07"));
        }

        public static function GetPFP()
        {
            if(self::LoggedIn()) return self::UserData()['avatar_url'];
            return "https://osu.ppy.sh/assets/images/avatar-guest.8a2df920.png";
        }
    }
}
