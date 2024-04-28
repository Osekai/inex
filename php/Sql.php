<?php
class Sql
{
    public static function parseArrayField($field)
    {
        return $field ? explode(',', $field) : [];
    }

    public static function parseArrayFieldWithIds($field, $keys = ["ID", "Name"], $separator = ",", $inner_separator = ":")
    {
        $result = [];

        if ($field) {
            $items = explode($separator, $field);
            foreach ($items as $item) {
                $parts = explode($inner_separator, $item);
                $itemData = [];
                for ($i = 0; $i < count($keys); $i++) {
                    $itemData[$keys[$i]] = $parts[$i] ?? null;
                }
                $result[] = $itemData;
            }
        }
        return $result;
    }
}
