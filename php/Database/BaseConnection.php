<?php

namespace Database;

use Database;
use DX\Setup;
use mysqli;

class BaseConnection
{
    public $connection;

    public function __construct($host, $username, $password, $database)
    {
        try {
            $this->connection = new mysqli($host, $username, $password, $database);
        } catch (\mysqli_sql_exception $e) {
            Setup::PrintError("Failed to connect to MySQL", $e->getMessage());
        }
        $this->connection->set_charset("utf8mb4"); // to fix emojis in comments
        $this->connection->options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);
    }

    /**
     * @param string $strQuery
     * @param string $strTypes
     * @param array $colVariables
     *
     * @return array
     */
    public function execSelect($strQuery, $strTypes, $colVariables, $cacheKey = "", $cacheLength = 0): array
    {
        $cacheKey .= "t" . $cacheLength;
        $cache = false;
        if ($cacheLength != 0) {
            if ($cacheKey != "") $cache = true;
            if ($cache == true) {
                $resp = Database\Memcache::get($cacheKey);
                if ($resp != false) return json_decode($resp, true);
            }
        }
        $mysql = $this->connection;
        $stmt = $mysql->prepare($strQuery);
        if ($strTypes !== "") {
            $stmt->bind_param($strTypes, ...$colVariables);
        }
        $stmt->execute();
        $meta = $stmt->result_metadata();

        while ($field = $meta->fetch_field()) $params[] = &$row[$field->name];
        $stmt->bind_result(...$params);
        while ($stmt->fetch()) {
            foreach ($row as $key => $val) {
                $c[$key] = $val;
            }
            $hits[] = $c;
        }
        if ($mysql->more_results()) {
            $mysql->next_result();
        }
        if (isset($hits)) {
            if ($cache == true) {
                Database\Memcache::set($cacheKey, json_encode($hits), $cacheLength);
            }
            return $hits;
        } else {
            return [];
        }
    }

    public function execSelectStream($strQuery, $strTypes, $colVariables, callable $callback): void
    {
        $mysql = $this->connection;
        $stmt = $mysql->prepare($strQuery);
        $stmt->bind_param($strTypes, ...$colVariables);
        $stmt->execute();
        $stmt->store_result(); // needed for memory-efficient row-by-row access
        $meta = $stmt->result_metadata();

        while ($field = $meta->fetch_field()) $params[] = &$row[$field->name];
        $stmt->bind_result(...$params);

        while ($stmt->fetch()) {
            $c = [];
            foreach ($row as $key => $val) $c[$key] = $val;
            $callback($c);
        }

        $stmt->free_result();
    }

    /**
     * @param string $strQuery
     *
     * @return array
     */
    public function execSimpleSelect($strQuery, $cacheKey = "", $cacheLength = 0): array
    {
        return $this->execSelect($strQuery, "", [], $cacheKey, $cacheLength);
    }

    /**
     * @param string $strQuery
     * @param string $strTypes
     * @param array $colVariables
     *
     * @return void
     */
    public function execOperation($strQuery, $strTypes, $colVariables): void
    {
        $mysql = $this->connection;
        $stmt = $mysql->prepare($strQuery);
        if (!$stmt) {
            echo "Error in preparing statement: " . $mysql->error;
            exit;
        }

        $bindResult = $stmt->bind_param($strTypes, ...$colVariables);
        if (!$bindResult) {
            echo "Error in binding parameters: " . $stmt->error;
            exit;
        }

        $executionResult = $stmt->execute();
        if (!$executionResult) {
            echo "Error in executing statement: " . $stmt->error;
            exit;
        }
    }

    /**
     * @param string $strQuery
     *
     * @return void
     */
    public function execSimpleOperation(string $strQuery): void
    {
        $mysql = $this->connection;
        $stmt = $mysql->prepare($strQuery);
        $stmt->execute();
    }
}