<?php
namespace Database {
    use Memcached;

    class Memcache
    {
        private static $db;
        private $connection;

        public function __construct()
        {
            $this->connection = new Memcached();
            $this->connection->addServer("127.0.0.1", 11211) or die("Could not connect");
        }

        public static function getConnection()
        {
            if (self::$db == null) {
                self::$db = new Memcache();
            }
            return self::$db->connection;
        }

        public static function get($key) {
            if (!USE_MEMCACHE) return false;
            $conn = self::getConnection();
            $value = $conn->get("inex-" . $key);
            if ($value === false && $conn->getResultCode() !== Memcached::RES_NOTFOUND) {
                error_log("Memcache GET failed: " . $conn->getResultMessage());
            }
            return $value;
        }

        public static function set($key, $value, $expiration = 0) {
            if (!USE_MEMCACHE) return false;
            $conn = self::getConnection();
            $result = $conn->set("inex-" . $key, $value, $expiration);
            if (!$result) {
                error_log("Memcache SET failed: " . $conn->getResultMessage());
            }
            return $result;
        }
        public static function remove($key) {
            if(!USE_MEMCACHE) return false;
            return self::getConnection()->delete("inex-" . $key);
        }
    }
}