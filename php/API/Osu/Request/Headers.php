<?php

namespace API\Osu\Request;

use API\Osu\Oauth\Token;

class Headers
{
    static function Get()
    {
        return [
            'Authorization: Bearer ' . Token::Get(),
            'Content-Type: application/json'
        ];
    }
}