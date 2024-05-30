<?php

class Caching
{
    static function Layer($key, $function, $time = 60 /* 60 seconds */) {
        if(USE_MEMCACHE) {
            $item = \Database\Memcache::getConnection()->get($key);
            if($item !== false) {
                return $item;
            }
            $data = $function();
            \Database\Memcache::getConnection()->set($key, $data, $time);
            return $data;
        }
    }
}