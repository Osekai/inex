<?php

namespace Tasks\Tasks;

use Database\Connection;
use Tasks\Task;

class UpdateProfilesBannersThemes extends Task
{
    public function Run(): void
    {
        $themes = [];
        $path = __DIR__ . "/../../../frontend/profiles-banners/";

        foreach(scandir($path) as $theme) {
            if($theme == "." || $theme == "..") continue;
            $realpath = realpath($path . $theme);
            // skips the shared profiles-banners.js/css files
            if(!is_dir($realpath)) continue;
            echo $realpath;
            $json = json_decode(file_get_contents($realpath . "/meta.json"), true);
            if(!isset($json['settings'])) {
                $json['settings'] = (object)[]; // so it encodes as {} later
            }
            $themes[] = $json;
        }

        print_r($themes);
        Connection::execSimpleOperation("DELETE FROM Profiles_Banners_Themes");
        foreach($themes as $theme) {
            $hidden = 0;
            if(isset($theme["hidden"]) && $theme["hidden"] === true) {
                $hidden = 1;
            }
            Connection::execOperation("INSERT INTO Profiles_Banners_Themes (`Key`, Name, Resolution, Category, Settings, Hidden) VALUES (?, ?, ?, ?, ?, ?)",
                "sssssi", [$theme["key"], $theme["name"], implode(":", $theme["resolution"]), $theme["category"], json_encode($theme["settings"]), $hidden]);
        }
    }
}