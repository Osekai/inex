<?php
namespace Tasks;

use Exception;

class Task
{
    public $taskName = "";

    public $frequency = null;

    public function Run()
    {


    }

    public function Log($text)
    {
        $color = $this->getColorFromTaskName($this->taskName);
        $tag = "[$this->taskName]";

        $totalWidth = 20;
        $currentWidth = strlen($tag) + 1;
        $padding = $totalWidth - $currentWidth;

        if ($padding > 0) {
            $tag = str_pad($tag, $currentWidth + $padding, " ", STR_PAD_LEFT);
        }

        echo $color . $tag . "\033[0m " . $text . "\n";
    }


    public function _Run()
    {
        $this->taskName = str_replace("Tasks\\Tasks\\", "", get_class($this));

        $this->Log("\033[36mRunning Task " . $this->taskName . "\033[0m");

        try {
            $this->Run();
            $this->Log("\033[32mFinished Task " . $this->taskName . "\033[0m\n");
        } catch (Exception $e) {
            $this->Log("\033[31mTask " . $this->taskName . " failed: " . $e->getMessage() . "\033[0m");
            $this->Log("Exception type: " . get_class($e));
            $this->Log("In file: " . $e->getFile() . " on line " . $e->getLine());
            $this->Log("Stack trace:\n" . $e->getTraceAsString());
        }
    }

    private function getColorFromTaskName($taskName)
    {
        $hash = crc32($taskName);
        $colorCode = ($hash % 256);
        return "\033[38;5;{$colorCode}m";
    }
}
