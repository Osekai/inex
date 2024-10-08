<?php

namespace Tasks\Runners;

use API\Osu\Beatmapsets;
use Data\Medals;
use Database\Connection;
use Tasks\AbstractRunner;

class BeatmapPacks extends AbstractRunner
{
    public function etirun($args): void
    {
        $packs = Connection::execSimpleSelect("SELECT * FROM Beatmaps_Packs");
        $medals_packs = Connection::execSimpleSelect("SELECT Medals_Solutions_Beatmaps_Packs.*, Medals_Data.Name FROM Medals_Solutions_Beatmaps_Packs
LEFT JOIN Medals_Data ON Medals_Data.Medal_ID = Medals_Solutions_Beatmaps_Packs.Medal_ID");


        function GetNewId($id) {
            $url = "https://osu.ppy.sh/beatmaps/packs/" . $id;
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_HEADER, true); // true to include the header in the output.
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Must be set to true true to follow any "Location: " header that the server sends as part of the HTTP header.
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // true to return the transfer as a string of the return value of curl_exec() instead of outputting it directly.
            $a = curl_exec($ch); // $a will contain all headers
            $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL); // This is what you need, it will return you the last effective URL
            $finalUrl = str_replace("https://osu.ppy.sh/beatmaps/packs/", "", $finalUrl);
            return $finalUrl;
        }

        foreach($medals_packs as $pack) {
            if($pack['Maps_Length'] == null) {
                $this->logger("Processing " . $pack['Pack_ID'] . " for " . $pack['Name']);

                $isLegacy = false;
                $packData = null;

                if(is_numeric($pack['Pack_ID'])) $isLegacy = true;

                if(!$isLegacy) {
                    $packData = \API\Osu\BeatmapPacks::GetPack($pack['Pack_ID']);
                }

                if($packData == null) {
                    $isLegacy = true;
                    $this->logger($pack['Pack_ID'] . " is using legacy id system, fetching new id.");
                    $new = GetNewId($pack['Pack_ID']);
                    Connection::execOperation("UPDATE `Medals_Solutions_Beatmaps_Packs` SET `Pack_ID` = ? WHERE `Pack_ID` = ?", "ss", [$new, $pack['Pack_ID']]);
                    $pack['Pack_ID'] = $new;
                }

                if($packData === null) {
                    // refetch if it hasn't been already
                    $packData = \API\Osu\BeatmapPacks::GetPack($pack['Pack_ID']);
                }

                $length = 0;
                foreach($packData['beatmapsets'] as $map) {
                    $extraMapInfo = \Caching::Layer("beatmap" . $map['id'], function () use ($map) {
                        return Beatmapsets::GetBeatmapset($map['id']);
                    }, 60*10);
                    $length += $extraMapInfo['beatmaps'][0]['hit_length'];
                }
                $this->logger("length is " . $length);

                Connection::execOperation(
                    "UPDATE `Medals_Solutions_Beatmaps_Packs` SET `Name` = ?, `Link` = ?, `Maps_Count` = ?, `Maps_Length` = ? WHERE `Pack_ID` = ?",
                    "ssiis", [$packData['name'], $packData['url'], count($packData['beatmapsets']), $length, $pack['Pack_ID']]);


                $this->logger("Processed " . $pack['Pack_ID'] . " \n");
            }
        }


        //$posts = $this->table('Common_Votes');
        //$posts->truncate();
        //$posts->insert($newVotes)
        //    ->saveData();
    }
}