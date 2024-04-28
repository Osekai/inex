<?php
// consumer.php

use Enqueue\SimpleClient\SimpleClient;
use Interop\Queue\Message;
use Interop\Queue\Processor;

include "../config.php";
include '../vendor/autoload.php';

$client = new SimpleClient('beanstalk:');

$client->bindTopic('test', function(Message $psrMessage) {
    // processing logic here
    error_log(json_encode($psrMessage));

    return Processor::ACK;
});



$client->bindTopic('webhook-log', function(Message $psrMessage) {
    // processing logic here

    $body = json_decode($psrMessage->getBody(), true, JSON_UNESCAPED_SLASHES);
    $url = WEBHOOKS[$body["webhook"]];
    error_log($url);
    $POST = $body["data"];
    $headers = [ 'Content-Type: application/json; charset=utf-8' ];


    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($POST));
    $response   = curl_exec($ch);
    error_log(json_encode($body['data'], JSON_PRETTY_PRINT));
    error_log($response);

    return Processor::ACK;
});

// this call is optional but it worth to mention it.
// it configures a broker, for example it can create queues and excanges on RabbitMQ side.
$client->setupBroker();

$client->consume();