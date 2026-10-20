<?php

namespace Tasks;

use Database\Connection;

class Tasks
{
    public static function RunSpecific($name)
    {
        if ($name === 'help' || empty($name)) {
            self::listAvailableTasks();
            return;
        }

        // allow dotted paths
        $classPath = str_replace('.', '\\', $name);

        $classNamespace = '\\Tasks\\Tasks\\' . $classPath;

        if (class_exists($classNamespace)) {
            $instance = new $classNamespace();
            self::updateTaskTable($name, $instance->frequency ?? 0, 'running');

            if (method_exists($instance, '_Run')) {
                $instance->_Run();
                self::updateTaskTable($name, $instance->frequency ?? 0, 'success');
            } else {
                self::updateTaskTable($name, $instance->frequency ?? 0, 'failed');
                throw new \Exception("Method '_Run' not found in class $classNamespace");
            }
        } else {
            echo "Class $classNamespace not found.\n\n";
            self::listAvailableTasks();
        }
    }

    private static function listAvailableTasks()
    {
        echo "Available tasks:\n";

        $taskDir = __DIR__ . '/Tasks';
        if (!is_dir($taskDir)) {
            echo "No task directory found.\n";
            return;
        }

        $rii = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($taskDir)
        );

        foreach ($rii as $file) {
            if ($file->isDir()) continue;
            if (!preg_match('/^(.*)\.php$/', $file->getFilename())) continue;

            // build dotted name
            $rel = str_replace($taskDir . '/', '', $file->getPathname());
            $rel = substr($rel, 0, -4);
            $rel = str_replace('/', '.', $rel);

            echo " - $rel\n";
        }
    }

    public static function getTasksWithFrequency(): array
    {
        $taskDir = __DIR__ . '/Tasks';
        if (!is_dir($taskDir)) return [];

        $tasks = [];
        $rii = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($taskDir)
        );

        foreach ($rii as $file) {
            if ($file->isDir()) continue;
            if (!preg_match('/^(.*)\.php$/', $file->getFilename())) continue;

            $rel = str_replace($taskDir . '/', '', $file->getPathname());
            $rel = substr($rel, 0, -4);

            $classNamespace = '\\Tasks\\Tasks\\' . str_replace('/', '\\', $rel);

            if (!class_exists($classNamespace)) continue;

            $freq = (new $classNamespace())->frequency ?? null;
            if ($freq !== null) {
                $taskName = str_replace('/', '.', $rel);
                $tasks[$taskName] = $freq;
            }
        }

        return $tasks;
    }

    private static function updateTaskTable(string $taskName, int $frequency, string $status): void
    {
        $now = date('Y-m-d H:i:s');

        Connection::execOperation(
            "REPLACE INTO Site_Tasks (TaskName, Frequency, LastRan, Status) VALUES (?, ?, ?, ?)",
            "siss",
            [$taskName, $frequency, $now, $status]
        );
    }
}
