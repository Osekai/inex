<?php

namespace Site;

class Embed
{
    public static $title = "Unknown Page";
    public static $description = "We don't know what this page is :(";
    public static $image = null;
    public static $image_width = null;
    public static $image_height = null;
    public static $image_banner = null;
    public static $image_alt = null ;
    public static $tags = "achievements,osekai,solutions,tips,osu,medals,solution,osu!,osugame,game";
    public static $article = [
        "published_time" => "",
        "author" => "",
        "section" => "",
        "tags" => ""
    ];

    public static $large_image = false;

    static function SetTitle($title)
    {
        self::$title = strip_tags($title);
    }

    static function SetDescription($description)
    {
        self::$description = strip_tags($description);
    }

    static function AddTags($tags)
    {
        self::$tags .= "," . strip_tags($tags);
    }

    static function SetImage($image, $width = null, $height = null)
    {
        self::$image = strip_tags($image);
        self::$image_width = $width;
        self::$image_height = $height;
    }

    public static function SetBannerImage($image)
    {
        self::SetImage($image);
        self::$image_banner = strip_tags($image);
        self::$large_image = true;
    }
}