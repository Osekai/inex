<?php

namespace Image {
    class Transform
    {
        public static function ImageToJpeg($image, $quality, $addBackground = true)
        {
            // If addBackground is true, add a black background to the image
            if ($addBackground) {
                $newImage = imagecreatetruecolor(imagesx($image), imagesy($image));
                $black = imagecolorallocate($newImage, 0, 0, 0);
                imagefill($newImage, 0, 0, $black);
                imagecopy($newImage, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));
                $image = $newImage;
            }

            ob_start();
            imagejpeg($image, null, $quality);
            $imageData = ob_get_contents();
            ob_end_clean();

            return $imageData;
        }

        public static function GetResizeBounds($size, $direction, $sourceWidth, $sourceHeight)
        {
            // Calculate the new dimensions based on the specified direction
            if ($direction === "width") {
                $newWidth = $size;
                $newHeight = ($size / $sourceWidth) * $sourceHeight;
            } elseif ($direction === "height") {
                $newHeight = $size;
                $newWidth = ($size / $sourceHeight) * $sourceWidth;
            } else {
                return false; // Invalid direction
            }

            // Create a new image with transparency for the resized image
            if ($newWidth < 1) $newWidth = 1; // :/ dumb
            if ($newHeight < 1) $newHeight = 1;

            return [$newWidth, $newHeight];
        }

        public static function Resize($sourceImage, $size, $direction = "height")
        {
            $sourceWidth = imagesx($sourceImage);
            $sourceHeight = imagesy($sourceImage);

            // Create a new image with transparency
            $destinationImage = imagecreatetruecolor($sourceWidth, $sourceHeight);
            imagealphablending($destinationImage, false);
            imagesavealpha($destinationImage, true);

            // Copy the source image to the destination image
            imagecopy($destinationImage, $sourceImage, 0, 0, 0, 0, $sourceWidth, $sourceHeight);

            [$newWidth, $newHeight] = self::GetResizeBounds($size, $direction, $sourceWidth, $sourceHeight);

            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);

            // Resize the image
            imagecopyresampled($resizedImage, $destinationImage, 0, 0, 0, 0, $newWidth, $newHeight, $sourceWidth, $sourceHeight);

            // Destroy the temporary destination image
            imagedestroy($destinationImage);

            // Return the resized image with transparency
            return $resizedImage;
        }

        public static function ResizeStr($sourceImage, $size, $direction = "height", $quality = -1)
        {
            return self::ImageToJpeg(self::Resize($sourceImage, $size, $direction), $quality);
        }

        public static function ResizeCrop($source, $dst_width, $dst_height)
        {
            $src_width = imagesx($source);
            $src_height = imagesy($source);

            $src_x = 0;
            $src_y = 0;

            $src_aspect = $src_width / $src_height;
            $dst_aspect = $dst_width / $dst_height;

            $src_final_width = $src_width;
            $src_final_height = $src_height;

            if ($dst_aspect < $src_aspect) {
                $src_final_width = $src_height * $dst_aspect;
                $src_x = ($src_width - $src_final_width) / 2;
            } else {
                $src_final_height = $src_width / $dst_aspect;
                $src_y = ($src_height - $src_final_height) / 2;
            }

            $thumb = imagecreatetruecolor($dst_width, $dst_height);
            imagecopyresampled($thumb, $source, 0, 0, $src_x, $src_y, $dst_width, $dst_height, $src_final_width, $src_final_height);
            return $thumb;
        }

        public static function ResizeCropStr($sourceImage, $width, $height, $quality = -1)
        {
            return self::ImageToJpeg(self::ResizeCrop($sourceImage, $width, $height), $quality);
        }
    }
}