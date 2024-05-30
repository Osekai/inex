<?php

class Caching
{
    static function Layer($key, $function, $time = 60 /* 60 seconds */)
    {
        $item = \Database\Memcache::get($key);
        if ($item !== false) {
            return $item;
        }
        $data = $function();
        \Database\Memcache::set($key, $data, $time);
        return $data;
    }
}