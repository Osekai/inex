<?php

namespace Tasks;

use Database\BaseConnection;
use Phinx\Seed\AbstractSeed;

class AbstractRunner extends AbstractSeed
{
    public $log = true;
    public function logger($text) {
        if(!$this->log) return;
        echo $text . "\n";
    }
    public function etirun($args): void
    {
    }
    public BaseConnection $eclipse_db;
}