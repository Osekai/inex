<?php

namespace Tasks\Tasks;

use Database\Connection;
use Database\ViewManager;
use Tasks\Task;

class DB_UpdateViews extends Task
{
    public function Run(): void
    {
        ViewManager::syncAll();
    }
}