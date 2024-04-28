<?php

namespace API\Osu\Oauth;

class Token
{
    static function Get()
    {
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
            return $response['access_token'];
        }, 6000);
        // TODO: use user's token instead of client
        // TODO: make this function actually good :)

    }
}