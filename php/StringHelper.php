<?php

class StringHelper
{
    public static function StringToTag($string): array|string|null
    {
        $cleanedString = preg_replace("/[^a-zA-Z0-9-_]+/", "", $string);
        $tag = str_replace(" ", "-", $cleanedString);
        return strtolower($tag);
    }

    public static function BlacklistCheck($string): array|bool
    {
        $words = preg_split('/\s+/', strtolower(strip_tags($string)), -1, PREG_SPLIT_NO_EMPTY);
        $blacklisted = array_intersect($words, array_column(WORD_BLACKLIST, 'Word'));
        return $blacklisted ? array_values($blacklisted) : false;
    }

    public static function BlacklistCheckWebhook($string, $where): array|bool
    {
        $blacklisted = self::BlacklistCheck($string);
        $string = str_replace("`", "'", $string);
        $string = str_replace("@", "(at)", $string);

        if($blacklisted) {
            $blacklistedWords = implode(', ', $blacklisted);
            //if(USE_BEANSTALK)
            //Queue::getClient()->sendEvent("webhook-log", [
            //    "webhook" => "blocked",
            //    "data" => [
            //        "username" => "!",
            //        "content" => URL . "/@" . Database\Session::UserData()['Tag'] . " - " . $where . "```" . $string . "``` filtered due to blocklist: " . json_encode($blacklistedWords)
            //    ]
            //]);
            return array_values($blacklisted);
        }
        return false;
    }
}