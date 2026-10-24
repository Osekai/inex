<?php

namespace Image;

use AWS\S3;

// ported from anthera (php/Image/GetImage.php), only the bits osekai needs
class GetImage
{
    /**
     * @param string $size Size of output. Available sizes: full, thumb
     * @param int $screenshotID ID of the screenshot
     * @param int $versionID ID of the version it belongs to
     * @return string
     */
    public static function SnapshotScreenshot(string $size, int $screenshotID, int $versionID, $returnOnlyPath = false): string
    {
        $available_sizes = ["full", "thumb"];
        if (!in_array($size, $available_sizes)) $size = "thumb";

        $path = "version/" . $versionID . "/screenshots/" . $screenshotID . "_" . $size . ".png";

        if ($returnOnlyPath) {
            return $path;
        }
        return S3::getUrl($path);
    }

    public static function SnapshotScreenshotObject(string $size, $screenshot, $returnOnlyPath = false)
    {
        if (!isset($screenshot)) return null;
        return self::SnapshotScreenshot($size, $screenshot['ID'], $screenshot['Version_ID'], $returnOnlyPath);
    }
}
