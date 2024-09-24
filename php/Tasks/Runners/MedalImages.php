<?php

namespace Tasks\Runners;

use Database\Connection;
use Tasks\AbstractRunner;

class MedalImages extends AbstractRunner
{
    public function etirun($args): void
    {
        $medals = Connection::execSimpleSelect("SELECT * FROM Medals_Data");
        $path = __DIR__ . "/../../../assets/osu";


        if (!file_exists($path)) {
            mkdir($path, 0777, true);
        }
        if (!file_exists($path . "/web")) {
            mkdir($path . "/web", 0777, true);
        }
        if (!file_exists($path . "/client")) {
            mkdir($path . "/client", 0777, true);
        }

        foreach($medals as $medal) {
            $slug = explode("/", $medal['Link']);
            $slug = array_reverse($slug)[0];
            if(file_exists($path . "/web/" . $slug)) {
                echo $slug . " exists\n";
                continue;
            }
            echo "getting " . $slug . "\n";

            $base_1x = "/web/" . $slug;
            $base_2x = str_replace(".png", "@2x.png", $base_1x);

            $client_1x = str_replace("/web", "/client", $base_1x);
            $client_2x = str_replace("/web", "/client", $base_2x);

            $osupath = "https://assets.ppy.sh/medals/";

            file_put_contents($path.$base_1x, file_get_contents($osupath.$base_1x));
            file_put_contents($path.$base_2x, file_get_contents($osupath.$base_2x));
            file_put_contents($path.$client_1x, file_get_contents($osupath.$client_1x));
            file_put_contents($path.$client_2x, file_get_contents($osupath.$client_2x));
        }
    }
}