<?php

namespace Oauth {

    use Ampra\IO;
    use Data;
    use Database;
    use General;
    use oauth;

    class Login
    {
        public static function GetAccessToken($code)
        {
            $post = [
                'client_id' => CLIENT_ID,
                'client_secret' => CLIENT_SECRET,
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => REDIRECT_URI
            ];

            $ch = curl_init('https://osu.ppy.sh/oauth/token');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $post);

            $response = curl_exec($ch);

            $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if ($http_status >= 400) {
                die("cannot contact osu servers, please try again later - error code X" . $http_status);
            }

            $response = json_decode($response, true);

            return $response['access_token'];
        }

        public static function GetUserData($token)
        {
            $headers = [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json'
            ];

            $curl = curl_init();
            curl_setopt($curl, CURLOPT_URL, "https://osu.ppy.sh/api/v2/me");
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);

            $response = curl_exec($curl);


            $http_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);

            if ($http_status >= 400) {
                die("cannot contact osu servers, please try again later - error code B" . $http_status . ":" . strlen($token));
            }

            if($response === null) {
                die("what " . $http_status . ":" . strlen($token));
            }

            return json_decode($response, true);
        }

        // dev only, pretends osu sent us back this user
        public static function GetDevUserData($id)
        {
            if (!DEV) {
                die("not in dev mode");
            }

            $userdata = \API\Osu\User::GetUser((int)$id);
            if (!is_array($userdata)) {
                die("couldn't get that user - " . $userdata);
            }

            // wipe them so they get the first time experience again
            if (isset($_GET['fresh'])) {
                Database\Connection::execOperation("DELETE FROM System_Users WHERE User_ID = ?", "i", [$userdata['id']]);
                Database\Connection::execOperation("DELETE FROM System_Users_Settings WHERE User_ID = ?", "i", [$userdata['id']]);
                Database\Connection::execOperation("DELETE FROM Rankings_Users WHERE ID = ?", "i", [$userdata['id']]);
            }

            return $userdata;
        }

        public static function FrontendLogin()
        {
            if (DEV && isset($_GET['devid'])) {
                $userdata = Oauth\Login::GetDevUserData($_GET['devid']);
            } else {
                $token = Oauth\Login::GetAccessToken($_GET['code']);

                $userdata = Oauth\Login::GetUserData($token);
            }

            if($userdata == null) {
                echo "oh no";
                exit;
            }

            $member = Database\Connection::execSelect("SELECT * FROM System_Users WHERE User_ID = ? AND Joined_Date IS NOT NULL", "i", [$userdata['id']]);
            if(count($member) == 0) {
                Database\Connection::execOperation("REPLACE INTO `System_Users` (`User_ID`, `Name`, `Joined_Date`)
VALUES (?, ?, now());", "is", [$userdata['id'], $userdata['username']]);

                // brand new, get scripts26 to grab their data straight away
                IO::Send("/queue/addUser", ["id" => $userdata['id']], "scripts26");
            }

            Database\Session::Login($userdata['id']);

            if (isset($_COOKIE['login_redir'])) {
                $redir = $_COOKIE['login_redir'];
                // only allow relative paths — no protocol, no external host
                if (preg_match('#^/[^/\\\\]#', $redir)) {
                    setcookie("login_redir", '', ['expires' => time() - 3600, 'path' => '/']);
                    General::Redirect($redir);
                }
            }
            General::Redirect("/home");

            exit;
        }
    }
}