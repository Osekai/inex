<?php

namespace Oauth {

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

            $response = json_decode(curl_exec($curl), true);

            if ($response === false) {
                die("cannot contact osu servers, please try again later");
            }

            $http_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);

            if ($http_status >= 400) {
                die("cannot contact osu servers, please try again later - error code B" . $http_status);
            }

            return $response;
        }

        public static function FrontendLogin()
        {
            $token = Oauth\Login::GetAccessToken($_GET['code']);

            $userdata = Oauth\Login::GetUserData($token);

            $member = Database\Connection::execSelect("SELECT * FROM System_Users WHERE User_ID = ?", "i", [$userdata['id']]);
            if(count($member) == 0) {
                Database\Connection::execOperation("INSERT INTO `System_Users` (`User_ID`, `Name`, `Joined_Date`)
VALUES (?, ?, now());", "is", [$userdata['id'], $userdata['username']]);
            }

            Database\Session::Login($userdata['id']);
            General::Redirect("/home");

            exit;
        }
    }
}