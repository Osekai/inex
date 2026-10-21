<?php

namespace Data\Profiles;

use API\Response;
use API\Osu\User;

class Search
{
    const MIN_LENGTH = 2;
    const MAX_LENGTH = 30;
    const MAX_RESULTS = 8;

    public static function Run($query): Response
    {
        if (!is_string($query)) return new Response(false, "Invalid search");
        $query = trim($query);
        if (mb_strlen($query) < self::MIN_LENGTH) return new Response(true, "Too short", []);
        if (mb_strlen($query) > self::MAX_LENGTH) return new Response(false, "Search is too long");

        // same searches come in a lot while people type
        $users = \Caching::Layer("profiles_search_" . md5(mb_strtolower($query)), function () use ($query) {
            return User::Search($query);
        }, 120);
        if ($users === null) return new Response(false, "Couldn't reach osu!");

        $results = [];
        foreach (array_slice($users, 0, self::MAX_RESULTS) as $user) {
            $results[] = [
                "id" => $user['id'],
                "username" => $user['username'],
                "country_code" => $user['country_code'] ?? ""
            ];
        }
        return new Response(true, "Success", $results);
    }
}
