<?php

namespace API\Osu\Oauth;

use DX\Setup;

class Token
{
    static function Get()
    {
        if (empty(CLIENT_ID) || empty(CLIENT_SECRET)) {
            Setup::PrintError("OAuth Client is not set up!", "Create one at <a href='https://osu.ppy.sh/home/account/edit'>https://osu.ppy.sh/home/account/edit</a> and put it into the <code>config.php</code>!");
        }
        return \Caching::Layer("access_token", function () {
            $post = [
                'client_id' => CLIENT_ID,
                'client_secret' => CLIENT_SECRET,
                'grant_type' => 'client_credentials',
                'scope' => 'public'
            ];

            $oAccess = curl_init('https://osu.ppy.sh/oauth/token');
            curl_setopt($oAccess, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($oAccess, CURLOPT_POSTFIELDS, $post);

            $response = json_decode(curl_exec($oAccess), true);
            if(isset($response['error'])) {
                Setup::PrintError("Cannot get access token!", "Error: " . $response['error'] . " - " . $response['error_description'] . "<br>You might need to set up a proper OAuth client! Create one <a href='https://osu.ppy.sh/home/account/edit'>here</a> and put it into the <code>config.php</code>!");
            }
            return $response['access_token'];
        }, 6000);
        // TODO: use user's token instead of client
        // TODO: make this function actually good :)

    }
}