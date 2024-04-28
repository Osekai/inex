<?php

class API {
    public static function Response($text, $id = null): array
    {
        return [
            "text" => $text,
            "id" => $id
        ];
    }
}