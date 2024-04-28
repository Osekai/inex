<?php
class General
{
    public static function Include($path)
    {
        include_once($_SERVER['DOCUMENT_ROOT'] . "/" . $path);
    }

    public static function Redirect($url)
    {
        echo "<script>
    window.location.href = '" . $url . "';
    </script>";
        exit;
    }

    public static function hex2hsl($RGB, $ladj = 0)
    {
        //have we got an RGB array or a string of hex RGB values (assume it is valid!)
        if (!is_array($RGB)) {
            $hexstr = ltrim($RGB, '#');
            if (strlen($hexstr) == 3) {
                $hexstr = $hexstr[0] . $hexstr[0] . $hexstr[1] . $hexstr[1] . $hexstr[2] . $hexstr[2];
            }
            $R = hexdec($hexstr[0] . $hexstr[1]);
            $G = hexdec($hexstr[2] . $hexstr[3]);
            $B = hexdec($hexstr[4] . $hexstr[5]);
            $RGB = array($R, $G, $B);
        }
        // scale the RGB values to 0 to 1 (percentages)
        $r = $RGB[0] / 255;
        $g = $RGB[1] / 255;
        $b = $RGB[2] / 255;
        $max = max($r, $g, $b);
        $min = min($r, $g, $b);
        // lightness calculation. 0 to 1 value, scale to 0 to 100% at end
        $l = ($max + $min) / 2;

        // saturation calculation. Also 0 to 1, scale to percent at end.
        $d = $max - $min;
        if ($d == 0) {
            // achromatic (grey) so hue and saturation both zero
            $h = $s = 0;
        } else {
            $s = $d / (1 - abs((2 * $l) - 1));
            // hue (if not grey) This is being calculated directly in degrees (0 to 360)
            switch ($max) {
                case $r:
                    $h = 60 * fmod((($g - $b) / $d), 6);
                    if ($b > $g) { //will have given a negative value for $h
                        $h += 360;
                    }
                    break;
                case $g:
                    $h = 60 * (($b - $r) / $d + 2);
                    break;
                case $b:
                    $h = 60 * (($r - $g) / $d + 4);
                    break;
            } //end switch
        } //end else
        // make any lightness adjustment required
        if ($ladj > 0) {
            $l += (1 - $l) * $ladj / 100;
        } elseif ($ladj < 0) {
            $l += $l * $ladj / 100;
        }
        //put the values in an array and scale the saturation and lightness to be percentages
        $hsl = array(round($h), round($s * 100), round($l * 100));
        //we could return that, but lets build a CSS compatible string and return that instead
        return $hsl;
    }

    public static function gcd($a, $b)
    {
        return $b === 0 ? $a : General::gcd($b, $a % $b);
    }
}