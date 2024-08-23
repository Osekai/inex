<?php
namespace API\Osu {

    use API\Osu\Request\Headers;

    class Beatmapset {
        static function GetBeatmapset($id) {
            $handle = curl_init();
            curl_setopt($handle, CURLOPT_URL, "https://osu.ppy.sh/api/v2/beatmapsets/" . $id);
            curl_setopt($handle, CURLOPT_HTTPHEADER, Headers::Get());
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, TRUE);

            $result = curl_exec($handle);
            $response_code = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            if ($response_code != 200)
                return "Cannot Get Beatmapset Data ; " . $response_code;

            return json_decode($result, true);
        }
    }
}