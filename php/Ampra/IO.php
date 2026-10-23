<?php

namespace Ampra;

use API\Response;

class IO
{
    static $services = [
        "ampra" => "127.0.0.1:13416",
        "imagepier" => "127.0.0.1:13426",
        "scripts26" => SCRIPTS26_ADDRESS,
    ];

    static function Send($url, $params, $service = "ampra", $getResponse = false)
    {
        // scripts26 wants its admin password on anything that changes data
        $auth = null;
        if ($service == "scripts26") {
            $auth = "Basic " . base64_encode("inex:" . SCRIPTS26_PASSWORD);
        }

        $service = self::$services[$service];
        $service = explode(":", $service);

        $host = $service[0];
        $port = $service[1];
        $query = http_build_query($params);
        $fullUrl = "http://$host:$port$url";

        if ($getResponse) {
            // Use cURL to send the request and get a response
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $fullUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $query);
            $headers = [
                "Content-Type: application/x-www-form-urlencoded"
            ];
            if ($auth != null) {
                $headers[] = "Authorization: " . $auth;
            }
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

            $response = curl_exec($ch);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                return (new Response(-1, "cURL Error", ["error" => $error]))->ReturnJson();
            }
            return $response;
        } else {
            // Use fsockopen for fire-and-forget
            $fp = fsockopen($host, $port, $errno, $errstr, 30);
            if (!$fp) {
                error_log("Failed to connect to $host:$port: $errstr ($errno)");
            } else {

                $out = "POST $url HTTP/1.1\r\n";
                $out .= "Host: $host\r\n";
                $out .= "Content-Type: application/x-www-form-urlencoded\r\n";
                $out .= "Content-Length: " . strlen($query) . "\r\n";
                if ($auth != null) {
                    $out .= "Authorization: " . $auth . "\r\n";
                }
                $out .= "Connection: Close\r\n\r\n";
                $out .= $query;

                fwrite($fp, $out);
                fclose($fp);
            }
        }
    }
}