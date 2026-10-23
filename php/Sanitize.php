<?php

use ezyang\HTMLPurifier as PurifierLib;
class Sanitize {
    public static function HTML($string, $allowHtml = false) {
        $config = HTMLPurifier_Config::createDefault();
        $config->set('HTML', 'Allowed', $allowHtml);
        if($allowHtml == false) {
            $string = strip_tags($string);
        }
        $purifier = new HTMLPurifier($config);
        return $purifier->purify($string);
    }

    public static function String(string $string, $allowNewlines = false)
    {
        // List of bad characters to remove
        $bad_characters = [
            "\xE2\x80\x8B", // Zero Width Space
            "\xE2\x80\x8C", // Zero Width Non-Joiner
            "\xE2\x80\x8D", // Zero Width Joiner
            "\xEF\xBB\xBF", // UTF-8 BOM
            "\x0D\x0A",     // Windows CRLF line endings
            "\x0D",         // Carriage Return
            "\x7F",         // Delete (DEL)
            "\x00",         // Null character
            "\x01",         // Start of Heading
            "\x02",         // Start of Text
            "\x03",         // End of Text
            "\x04",         // End of Transmission
            "\x05",         // Enquiry
            "\x06",         // Acknowledge
            "\x07",         // Bell
            "\x08",         // Backspace
            "\x09",         // Horizontal Tab
            "\x0A",         // Line Feed
            "\x0B",         // Vertical Tab
            "\x0C",         // Form Feed
            "\x0E",         // Shift Out
            "\x0F",         // Shift In
            "\x10",         // Data Link Escape
            "\x11",         // Device Control 1
            "\x12",         // Device Control 2
            "\x13",         // Device Control 3
            "\x14",         // Device Control 4
            "\x15",         // Negative Acknowledge
            "\x16",         // Synchronous Idle
            "\x17",         // End of Transmission Block
            "\x18",         // Cancel
            "\x19",         // End of Medium
            "\x1A",         // Substitute
            "\x1B",         // Escape
            "\x1C",         // File Separator
            "\x1D",         // Group Separator
            "\x1E",         // Record Separator
            "\x1F",         // Unit Separator
            "\x7F",         // Delete (DEL)
            "\xE1\x85\x9F", // Hangul Choseong Filler
            "\xE1\x85\xA0", // Hangul Jungseong Filler
            "\xE3\x85\xA4", // Hangul Filler
            "\xEF\xBE\xA0", // Halfwidth Hangul Filler
        ];

        // multiline text like markdown needs its line feeds and tabs
        if ($allowNewlines) {
            $bad_characters = array_values(array_diff($bad_characters, ["\x0D\x0A", "\x0A", "\x09"]));
        }


        $filtered_string = preg_replace('/[' . preg_quote(implode('', $bad_characters), '/') . ']/u', '', $string);

        return $filtered_string;
    }

}