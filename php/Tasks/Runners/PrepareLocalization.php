<?php
namespace Tasks\Runners;
use Tasks\AbstractRunner;

class PrepareLocalization extends AbstractRunner
{
    private string $projectRoot;
    private string $langDir;
    private array $gitignorePatterns = [];

    public function __construct()
    {
        parent::__construct();
        $this->projectRoot = ROOT;
        $this->langDir = $this->projectRoot . '/public/lang';
        $this->loadGitignore();
    }

    private function loadGitignore(): void
    {
        $gitignorePath = $this->projectRoot . '/.gitignore';
        if (!file_exists($gitignorePath)) return;

        $lines = file($gitignorePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) continue;
            $this->gitignorePatterns[] = $line;
        }
    }

    private function isIgnored(string $path): bool
    {
        $relative = ltrim(str_replace($this->projectRoot, '', $path), '/');

        // skip hidden files/dirs
        foreach (explode('/', $relative) as $part) {
            if (str_starts_with($part, '.')) return true;
        }

        // skip gitignored paths
        foreach ($this->gitignorePatterns as $pattern) {
            $pattern = ltrim($pattern, '/');
            // convert gitignore glob to regex
            $regex = '#^' . str_replace(['\*\*', '\*', '\?'], ['.*', '[^/]*', '[^/]'], preg_quote($pattern, '#')) . '(/|$)#';
            if (preg_match($regex, $relative)) return true;
        }

        return false;
    }

    public function ReadFiles(): array
    {
        $found = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveCallbackFilterIterator(
                new \RecursiveDirectoryIterator($this->projectRoot, \FilesystemIterator::SKIP_DOTS),
                function ($file) {
                    return !$this->isIgnored($file->getPathname());
                }
            )
        );

        foreach ($iterator as $file) {
            if (!$file->isFile()) continue;
            if ($this->isIgnored($file->getPathname())) continue;

            $inThisFile = [];

            $contents = file_get_contents($file->getPathname());

            // {{home/header.h1 | Default text}} in PHP templates/attributes
            preg_match_all('/\{\{([a-zA-Z0-9_.\/-]+)\s*\|\s*([^}]+?)\s*\}\}/', $contents, $matches, PREG_SET_ORDER);
            foreach ($matches as $match) {
                $inThisFile[$match[1]] = trim($match[2]);
            }

            // <p langkey="home/header.h1">Default text</p> in HTML
            preg_match_all('/langkey=["\']([a-zA-Z0-9_.\/-]+)["\']\s*>([^<]+)</', $contents, $matches, PREG_SET_ORDER);
            foreach ($matches as $match) {
                $inThisFile[$match[1]] = trim($match[2]);
            }

            // Trans('home/header.h1', 'Default text') in JS
            preg_match_all('/\bTrans\(\s*["\']([a-zA-Z0-9_.\/-]+)["\']\s*,\s*["\']([^"\']+)["\']\s*\)/', $contents, $matches, PREG_SET_ORDER);
            foreach ($matches as $match) {
                $inThisFile[$match[1]] = trim($match[2]);
            }

            $found = array_merge($found, $inThisFile);

            if(count($inThisFile) > 0) {
                echo "Found " . count($inThisFile) . " keys in " . $file->getPathname() . "\n";
            }
        }

        return $found;
    }

    function etirun($args): void
    {
        $found = $this->ReadFiles();
        $outputPath = $this->langDir . '/en_GB.json';

        if (!is_dir($this->langDir)) mkdir($this->langDir, 0755, true);

        $existing = [];
        if (file_exists($outputPath)) {
            $existing = json_decode(file_get_contents($outputPath), true) ?? [];
        }

        foreach ($found as $key => $default) {
            $parts = explode('/', $key, 2);
            $section = $parts[0];
            $subkey = $parts[1] ?? $parts[0];

            if (!isset($existing[$section][$subkey])) {
                $existing[$section][$subkey] = $default;
            }
        }

        ksort($existing);
        file_put_contents($outputPath, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");
        echo "Done. " . count($found) . " keys written to $outputPath\n";
    }
}
