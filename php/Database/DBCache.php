<?php

namespace Database;

class DBCache
{

    public function __construct()
    {
    }


    private function clean()
    {
        Connection::execSimpleOperation("DELETE FROM Cache WHERE `Expiry` <= NOW()");
    }

    public function get(string $string)
    {
        // check for expiry date as well
        $query = Connection::execSelect(
            "SELECT * FROM Cache WHERE `Key` = ? AND `Expiry` > NOW()",
            "s",
            [$string]
        );
        if (count($query) > 0) return $query[0]['Value'];
        return false;
    }

    public function set(string $string, $content, int $int)
    {
        self::clean();
        $expiryTimestamp = time() + $int;
        $expiryDate = date('Y-m-d H:i:s', $expiryTimestamp);

        Connection::execOperation("INSERT INTO Cache (`Key`, `Value`, `Expiry`) VALUES (?, ?, ?)", "sss", [$string, $content, $expiryDate]);
    }
}