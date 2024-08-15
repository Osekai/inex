<?php
use Enqueue\SimpleClient\SimpleClient;
class Queue
{
    private static $queue;
    private $client;

    public function __construct()
    {
        $this->client = new SimpleClient('beanstalk:'); // the queue will store messages in tmp folder
    }

    public static function getClient()
    {
        if (self::$queue == null) {
            self::$queue = new Queue();
        }
        return self::$queue->client;
    }
}
