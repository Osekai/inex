<?php

namespace Database {

    class Connection
    {
        private static ?BaseConnection $db = null;



        public static function getConnection($host = DATABASE_HOSTNAME, $username = DATABASE_USERNAME, $password = DATABASE_PASSWORD, $database = DATABASE_NAME): \mysqli
        {
            if (self::$db == null) {
                self::$db = new BaseConnection($host, $username, $password, $database);
            }
            return self::$db->connection;
        }

        /**
         * @param string $strQuery
         * @param string $strTypes
         * @param array $colVariables
         *
         * @return array
         */
        public static function execSelect($strQuery, $strTypes, $colVariables, $cacheKey = "", $cacheLength = 0): array
        {
            self::getConnection();
            return self::$db->execSelect($strQuery, $strTypes, $colVariables, $cacheKey, $cacheLength);
        }

        /**
         * @param string $strQuery
         *
         * @return array
         */
        public static function execSimpleSelect($strQuery, $cacheKey = "", $cacheLength = 0): array
        {
            self::getConnection();
            return self::$db->execSimpleSelect($strQuery, $cacheKey, $cacheLength);
        }

        /**
         * @param string $strQuery
         * @param string $strTypes
         * @param array $colVariables
         *
         * @return void
         */
        public static function execOperation($strQuery, $strTypes, $colVariables): void
        {
            self::getConnection();
            self::$db->execOperation($strQuery, $strTypes, $colVariables);
        }

        /**
         * @param string $strQuery
         *
         * @return void
         */
        public static function execSimpleOperation($strQuery): void
        {
            self::getConnection();
            self::$db->execSimpleOperation($strQuery);
        }
    }
}