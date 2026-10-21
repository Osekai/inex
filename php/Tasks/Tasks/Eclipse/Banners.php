<?php

namespace Tasks\Tasks\Eclipse;

use Database\Connection;
use Tasks\EclipseTask;

// eclipse had one banner per user, they come over as an "eclipse" theme banner each
class Banners extends EclipseTask
{
    const IMPORTED_NAME = "Imported from Eclipse";

    public function Run(): void
    {
        // only clear out what this task made before, banners made in inex stay
        Connection::execOperation("DELETE FROM Profiles_Banners WHERE Theme_Key = 'eclipse' AND Name = ?", "s", [Banners::IMPORTED_NAME]);

        $banners = $this->eclipse_db->execSimpleSelect("SELECT * FROM ProfilesBanners");

        $data = [];
        foreach ($banners as $banner) {
            $data[] = [
                "User_ID" => $banner['UserID'],
                "Name" => Banners::IMPORTED_NAME,
                "Theme_Key" => "eclipse",
                "Settings" => json_encode($this->convertSettings($banner)),
            ];
        }

        foreach (array_chunk($data, 500) as $chunk) {
            $this->table('Profiles_Banners')->insert($chunk)->saveData();
        }
        echo "banners: transferred " . count($data) . PHP_EOL;
    }

    // custom gradient / solid -> the gradient background, every preset style -> club
    private function convertSettings(array $banner): array
    {
        if ($banner['Background'] != "custom") {
            return ["backgroundType" => "club"];
        }

        if ($banner['CustomStyle'] == "solid" && $banner['CustomSolid']) {
            return [
                "backgroundType" => "gradient",
                "backgroundGradient" => [$banner['CustomSolid'], $banner['CustomSolid']],
                "backgroundGradientAngle" => 0,
            ];
        }

        if ($banner['CustomStyle'] == "gradient" && $banner['CustomGradient']) {
            $gradient = json_decode($banner['CustomGradient'], true);
            if (is_array($gradient) && count($gradient) >= 2) {
                return [
                    "backgroundType" => "gradient",
                    "backgroundGradient" => [$gradient[0], $gradient[1]],
                    "backgroundGradientAngle" => (int)($gradient[2] ?? 90),
                ];
            }
        }

        // custom images were never finished in eclipse
        return ["backgroundType" => "club"];
    }
}
