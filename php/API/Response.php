<?php

namespace API;

use Debug\Timings;

class Response
{
    public $success = true;
    public $message = "";
    public $content = [];

    public function __construct($success = true, string $message = "", $content = [])
    {
        $this->success = $success;
        $this->message = $message;
        $this->content = $content;
    }

    public function Return()
    {
        return [
            "success" => $this->success,
            "message" => $this->message,
            "content" => $this->content,
            "timings" => Timings::get(),
        ];
    }

    public function ReturnJson()
    {
        header('Content-Type: application/json');
        Timings::finishAll();
        if (isset($_REQUEST['compress'])) {
            $data = [
                '_dev' => "Compressed response. Remove 'compress' parameter for human-readable form.",
                'success' => $this->success,
                'message' => $this->message,
                'content' => $this->_pack($this->content),
                //'timings' => Timings::get(),
            ];

            header('Content-Encoding: gzip');
            return gzencode(json_encode($data), 9);
        }
        return json_encode($this->Return());
    }

    private function _pack($data)
    {
        if (!is_array($data) || empty($data)) return $data;

        $isList = array_is_list($data);

        if ($isList) {
            // recursively pack each element first
            $data = array_map(fn($row) => is_array($row) ? $this->_pack($row) : $row, $data);

            if (!is_array($data[0])) return $data;

            // collect all keys across all rows
            $keys = [];
            foreach ($data as $row) {
                if (!is_array($row)) return $data;
                // if it was packed into _t format, can't column-pack this level
                if (isset($row['_t'])) return $data;
                foreach (array_keys($row) as $k) {
                    $keys[$k] = true;
                }
            }
            $keys = array_keys($keys);

            return [
                "_t" => true,
                "k" => $keys,
                "d" => array_map(fn($row) => array_map(fn($k) => $row[$k] ?? null, $keys), $data),
                "types" => array_map(fn($k) => gettype($data[0][$k]), $keys),
            ];
        } else {
            // associative — recurse into values
            foreach ($data as &$val) {
                if (is_array($val)) {
                    $val = $this->_pack($val);
                }
            }
            unset($val);
            return $data;
        }
    }
}