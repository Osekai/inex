<?php

// generates the spinner svg markup for a given number of spokes
function generate_spinner_svg($spokeCount = 12, $extraClass = "") {
    $angleStep = 360 / $spokeCount;
    $spokes = "";
    for ($i = 0; $i < $spokeCount; $i++) {
        $angle = round($i * $angleStep, 4);
        $spokes .= "<rect class='spoke' x='23' y='2' width='3' height='12' rx='2' transform='rotate($angle 25 25)' />\n";
    }
    $class = trim("spinner $extraClass");
    return "<svg viewBox='0 0 50 50' class='$class'>\n<g>\n$spokes</g>\n</svg>";
}

// generates the matching :nth-child animation-delay css rules
function generate_spinner_css($spokeCount = 12, $duration = 0.9) {
    $css = "";
    for ($i = 1; $i <= $spokeCount; $i++) {
        // last spoke (current position) gets 0s, each one before it is offset backwards
        $delay = -($duration - ($i / $spokeCount) * $duration);
        $delay = round($delay, 4);
        // avoid "-0" formatting for the final spoke
        if ($delay == 0) $delay = 0;
        $css .= ".spinner .spoke:nth-child($i) { animation-delay: {$delay}s; }\n";
    }
    return $css;
}

define("SPOKE_COUNT", 10);
define("LOADER", generate_spinner_svg(SPOKE_COUNT));
define("LOADER_SMALL", generate_spinner_svg(SPOKE_COUNT, "spinner-small"));
define("LOADER_CSS_DELAYS", generate_spinner_css(SPOKE_COUNT));