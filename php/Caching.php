<?php

class Caching
{
    static function Layer($key, $function, $time = 60 /* 60 seconds */)
    {
        $s = new \Debug\Timings("memcache layer for $key");
        $item = \Database\Memcache::get($key);
        if ($item !== false) {
            $s->finish();
            return $item;
        }
        $data = $function();

        if($data !== null) \Database\Memcache::set($key, $data, $time);

        $s->setDescription("failed cache layer");
        $s->finish();
        return $data;
    }
}