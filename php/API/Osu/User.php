<?php
namespace API\Osu {

    use API\Osu\Request\Headers;

    class User {
        static function GetUser($id, $gamemode = "") {
            if($gamemode !== "osu" && $gamemode !== "taiko" && $gamemode !== "fruits" && $gamemode !== "mania") {
                $gamemode = "";
            }

            $handle = curl_init();
            curl_setopt($handle, CURLOPT_URL, "https://osu.ppy.sh/api/v2/users/" . $id . "/" . $gamemode);
            curl_setopt($handle, CURLOPT_HTTPHEADER, Headers::Get());
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, TRUE);

            $result = curl_exec($handle);
            $response_code = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            if ($response_code != 200)
                return "Cannot Get User Data ; " . $response_code;

            return json_decode($result, true);
        }

        // osu's own user search, returns the list of users or null
        static function Search($query) {
            $handle = curl_init();
            curl_setopt($handle, CURLOPT_URL, "https://osu.ppy.sh/api/v2/search?mode=user&query=" . urlencode($query));
            curl_setopt($handle, CURLOPT_HTTPHEADER, Headers::Get());
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, TRUE);

            $result = curl_exec($handle);
            $response_code = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            if ($response_code != 200)
                return null;

            $result = json_decode($result, true);
            return $result['user']['data'] ?? [];
        }

        static function GetUserRulesets($id) {
            $handle = curl_init();
            curl_setopt($handle, CURLOPT_URL, "https://osu.ppy.sh/api/v2/users?ids[]=" . $id);
            curl_setopt($handle, CURLOPT_HTTPHEADER, Headers::Get());
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, TRUE);

            $result = curl_exec($handle);
            $response_code = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            if ($response_code != 200)
                return null;

            $result = json_decode($result, true);
            return $result['users'][0]['statistics_rulesets'] ?? null;
        }
    }
}