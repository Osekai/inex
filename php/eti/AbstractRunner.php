<?php

namespace eti;

use Database\BaseConnection;
use Phinx\Seed\AbstractSeed;

class AbstractRunner extends AbstractSeed
{
    public function etirun($args): void
    {
    }
    public BaseConnection $eclipse_db;
}