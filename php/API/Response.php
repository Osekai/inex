<?php

namespace API;

class Response
{
    public $success = true;
    public $message = "";
    public $content = [];

    public function __construct(bool $success = true, string $message = "", $content = [])
    {
        $this->success = $success;
        $this->message = $message;
        $this->content = $content;
    }

    public function Return() {
        return [
            "success" => $this->success,
            "message" => $this->message,
            "content" => $this->content,
        ];
    }
    public function ReturnJson() {
        return json_encode($this->Return());
    }
}