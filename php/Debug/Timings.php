<?php


namespace Debug;

class Timings implements \JsonSerializable
{
    static $finished = [];
    static $running = [];
    static $curId = 0;

    private string $name;
    private ?string $description = null;
    private int $id;
    private int $colour;
    public float $startTime;
    private ?float $finishTime = null;
    public string $trace;

    public function __construct(string $name, bool $instant = false)
    {
        $this->startTime = microtime(true);
        $this->id = self::$curId++;
        $this->name = $name;
        $this->colour = crc32($name) % 361;

        if ($instant) {
            $this->finishTime = $this->startTime;
            self::$finished[] = $this;
        } else {
            self::$running[] = $this;
        }

        $this->trace = implode("\n", array_map(function ($frame) {
            $file = $frame['file'] ?? '[internal]';
            $line = $frame['line'] ?? '';
            $func = $frame['function'] ?? '';
            return "$file:$line - $func()";
        }, debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)));

    }

    public function quick(callable $quick)
    {
        $quick();
        $this->finish();
    }

    public function setDescription(string $description): Timings
    {
        $this->description = $description;
        return $this;
    }

    public function finish()
    {
        if ($this->finishTime === null) {
            $this->finishTime = microtime(true);
            self::$finished[] = $this;

            $key = array_search($this, self::$running, true);
            if ($key !== false) unset(self::$running[$key]);
        }
    }

    public static function stFinish()
    {
        $last = array_pop(self::$running);
        if ($last) $last->finish();
    }

    public function jsonSerialize(): mixed
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'start' => $this->startTime,
            'finish' => $this->finishTime,
            'trace' => $this->trace,
            'colour' => $this->colour
        ];
    }
}