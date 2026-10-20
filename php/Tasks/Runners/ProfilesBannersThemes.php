<?php

namespace Tasks\Runners;

use Database\Connection;
use Tasks\AbstractRunner;

class ProfilesBannersThemes extends AbstractRunner
{
    public function etirun($args): void
    {
        $themes = [];
        $path = __DIR__ . "/../../../frontend/profiles-banners/";

        foreach(scandir($path) as $theme) {
            if($theme == "." || $theme == "..") continue;
            $realpath = realpath($path . $theme);
            echo $realpath;
            $json = json_decode(file_get_contents($realpath . "/meta.json"), true);
            if(!isset($json['settings'])) {
                $json['settings'] = (object)[]; // so it encodes as {} later
            }
            if($json['state'] === "hidden") continue;
            $themes[] = $json;
        }

        print_r($themes);
        Connection::execSimpleOperation("DELETE FROM Profiles_Banners_Themes");
        foreach($themes as $theme) {
            Connection::execOperation("INSERT INTO Profiles_Banners_Themes (`Key`, Name, Resolution, Category, Settings) VALUES (?, ?, ?, ?, ?)",
                "sssss", [$theme["key"], $theme["name"], implode(":", $theme["resolution"]), $theme["category"], json_encode($theme["settings"])]);
        }
    }
}