<?php

namespace Tasks\Tasks;

use Data\Profiles\Goals;
use Database\Connection;
use Tasks\Task;

// claims goals from Rankings_Users, the ones it can't check get claimed on profile load instead
class UpdateGoals extends Task
{
    public $frequency = 600;

    public function Run(): void
    {
        $users = Connection::execSimpleSelect("SELECT DISTINCT User_ID FROM Profiles_Goals WHERE Claimed IS NULL");
        $this->Log("Checking goals for " . count($users) . " users");

        $before = Connection::execSimpleSelect("SELECT COUNT(*) AS Count FROM Profiles_Goals WHERE Claimed IS NULL")[0]['Count'];

        foreach ($users as $user) {
            Goals::UpdateQuick($user['User_ID']);
        }

        $after = Connection::execSimpleSelect("SELECT COUNT(*) AS Count FROM Profiles_Goals WHERE Claimed IS NULL")[0]['Count'];
        $this->Log("Claimed " . ($before - $after) . " goals");
    }
}
