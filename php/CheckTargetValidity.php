<?php
use API\Response;
use Database\Connection;

class CheckTargetValidity
{
    public static function Check($target, $id) {
        if ($target == "Medals_Data") {
            $medal = Data\Medals::Get($id);
            if ($medal == null) return false;
        }
        if ($target == "Common_Comments") {
            $medal = Data\Comments::GetOne($id);
            if ($medal == null) return false;
        }
        if ($target == "Medals_Beatmaps") {
            $medal = Data\Medals::GetOneBeatmap($id);
            if ($medal == null) return false;
        }


        return true;
    }
}