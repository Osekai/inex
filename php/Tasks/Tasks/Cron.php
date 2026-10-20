<?php

namespace Tasks\Tasks;

use AWS\S3;
use Database\Connection;
use Tasks\Task;
use Tasks\Tasks;

class Cron extends Task
{
    public function Run(): void
    {
        $lastRun = [];

        while (true) {
            $tasks = Tasks::getTasksWithFrequency(); // get all tasks with defined frequency

            $now = time();
            foreach ($tasks as $taskName => $frequency) {
                $last = $lastRun[$taskName] ?? 0;

                if (($now - $last) >= $frequency) {
                    Tasks::RunSpecific($taskName); // call existing task runner
                    $lastRun[$taskName] = $now;
                }
            }

            usleep(500_000); // sleep 0.5 seconds to reduce CPU usage
        }
    }
}