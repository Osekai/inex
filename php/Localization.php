<?php

class Localization
{
    public $validLanguages = [
        "en_GB",
        "de_DE",
        "es_ES",
    ];
    private $lang = "en_GB";
    private $langData;
    public function __construct() {
        $lang = Caching::Layer("langfile_" . $this->lang, function () {
            return file_get_contents(ROOT . "/public/lang/" . $this->lang . ".json");
        });
        $this->langData = json_decode($lang, true);
    }
    public function Translate($scope, $key) {
        if($this->lang == "de_bug") return "!!" . $scope . "/" . $key . "!!";
        return $this->langData[$scope][$key];
    }

    public function ParseHTML($html) {
        // {{home/header.h1 | Default text}}
        $html = preg_replace_callback('/\{\{([a-zA-Z0-9_.\/-]+)\s*\|\s*([^}]+?)\s*\}\}/', function ($match) {
            $parts = explode('/', $match[1], 2);
            return $this->Translate($parts[0], $parts[1] ?? $parts[0]) ?? trim($match[2]);
        }, $html);

        // <p langkey="home/header.h1">Default text</p>
        $dom = new \DOMDocument();
        @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'), LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        $xpath = new \DOMXPath($dom);

        foreach ($xpath->query('//*[@langkey]') as $node) {
            $key = $node->getAttribute('langkey');
            $parts = explode('/', $key, 2);
            $translated = $this->Translate($parts[0], $parts[1] ?? $parts[0]);
            if ($translated) $node->nodeValue = $translated;
        }

        return $dom->saveHTML();
    }
}