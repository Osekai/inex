<?php

namespace Tasks\Tasks;

use Tasks\Task;

class Update extends Task
{
    public function Run()
    {
        (new DB_UpdateViews())->_Run();
        (new UpdateProfilesBannersThemes())->_Run();
        (new PrepareLocalization())->_Run();
    }
}
