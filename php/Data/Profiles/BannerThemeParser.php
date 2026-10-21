<?php

namespace Data\Profiles;

class BannerThemeParser
{
    public $css;
    public $html;
    public $classes;


    public function Parse($key, &$item, $settings, $use_settings = true)
    {
        $settings = (array)$settings;
        $item['value'] = $item['default'] ?? '';

        if (array_key_exists($key, $settings) && $use_settings) {
            $item['value'] = $settings[$key];
        }


        $output_type = "css-class";
        $output_suffix = "";
        $value = "";

        if (isset($item['output'])) {
            $output_type = $item['output']['type'];
            if (isset($item['output']['suffix'])) {
                $output_suffix = $item['output']['suffix'];
            }
        }

        if ($item['type'] == "enum") {
            $valid = false;

            foreach ($item['values'] as $v) {
                if ($v['key'] == $item['value']) {
                    $valid = true;
                }
            }

            if (!$valid) $item['value'] = $item['default'];
            $value = $item['value'];
        }


        if ($item['type'] == "range") {
            $value = floatval($item['value']);
        }
        if ($item['type'] == "color-hue") {
            $value = intval($item['value']); // 0 to 360
        }
        if ($item['type'] == "colour-picker") {
            $value = preg_match('/^#[0-9a-fA-F]{6}$/', $item['value']) ? $item['value'] : ($item['default'] ?? '#000000');
        }
        if ($item['type'] == "colour-gradient") {
            $valid = is_array($item['value']);

            if ($valid) {
                foreach ($item['value'] as $c) {
                    if (!is_string($c) || !preg_match('/^#[0-9a-fA-F]{6}$/', $c)) {
                        $valid = false;
                    }
                }
            }

            if (!$valid) $item['value'] = $item['default'];
            $value = $item['value'];
        }


        $item['value'] = $value;

        if ($output_type == "css-class") {
            $class = $item['value'];
            if (isset($item['output']['prefix'])) {
                $class = $item['output']['prefix'] . $class;
            }
            $this->classes .= $class . " ";
        }
        if ($output_type == "css-variable") {
            // gradients get split into -1, -2 etc
            if (is_array($item['value'])) {
                foreach ($item['value'] as $i => $v) {
                    $this->css .= "--dyn-$key-" . ($i + 1) . ": {$v}$output_suffix;\n";
                }
            } else {
                $this->css .= "--dyn-$key: {$item['value']}$output_suffix;\n";
            }
        }
    }
}
