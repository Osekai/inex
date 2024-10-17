<?php

namespace Data\Medals;

use API\Response;
use Data\Beatmaps;
use Data\Medals;
use Data\OsekaiUsers;
use Database\Connection;
use Database\Session;
use Woeler\DiscordPhp\Message\DiscordEmbedMessage;
use Woeler\DiscordPhp\Webhook\DiscordWebhook;

class MedalsBeatmaps
{

    public static function AdminDelete($id)
    {
        if(!OsekaiUsers::HasPermission("medals.beatmaps.delete.any")) return new Response(false, "no");
        return self::Delete($id, true);
    }
    public static function Delete($id, $skipCheck = false)
    {
        $comment = self::GetOneBeatmap($id);
        if ($comment['Beatmap_Submitted_User_ID'] !== Session::UserData()['id'] && !$skipCheck) return new Response(false, "Not your comment, silly");

        Connection::execOperation("UPDATE Medals_Beatmaps SET Deleted = 1 WHERE ID = ?", "i", [$id]);

        return new Response(true, "ok");
    }

    public static function AddBeatmap($link, $medal, $note = null): Response
    {
        if (!Session::LoggedIn()) return new Response(false, "logged out");
        $link = str_replace("https://osu.ppy.sh/beatmapsets/", "", $link);
        $link = explode("?", $link)[0];
        $id = explode("/", $link)[1];

        if (!is_numeric($id) || $id == "") {
            return new Response(false, "Invalid Link " . $id);
        }

        $medalinfo = Medals::Get($medal);
        if ($medalinfo == null) return new Response(false, "Invalid");
        if ($medalinfo['Is_Restricted'] == 1) return new Response(false, "Not Allowed");

        $beatmap = Beatmaps::GetBeatmap($id);


        if ($beatmap['Status'] == "graveyard" || $beatmap['Status'] == "pending" || $beatmap['Status'] == "wip") {
            return new Response(false, "Map is graveyarded");
        }


        Beatmaps::StoreBeatmap($beatmap);
        Connection::execOperation("INSERT INTO `Medals_Beatmaps` (`Medal_ID`, `Beatmap_ID`, `Beatmap_Submitted_User_ID`, `Beatmap_Submitted_Date`)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP());", "iii", [$medalinfo['Medal_ID'], $id, Session::UserData()['id']]);

        self::WipeBeatmapCache($medal);


        $beatmap = self::GetBeatmaps($medal, $id)->content[0];

        if ($note != null) {
            self::AddNote($beatmap['ID'], $note);
            $beatmap = self::GetBeatmaps($medal, $id)->content[0];
        }

        return new Response(true, "", $beatmap);
    }

    public static function AddNote($id, $note)
    {
        Connection::execOperation("UPDATE `Medals_Beatmaps` SET `Note` = ?, `Note_Submitted_User_ID` = ?, `Note_Submitted_Date` = CURRENT_TIMESTAMP WHERE `ID` = ?;", "sii", [$note, Session::UserData()['id'], $id]);
    }

    public static function GetPacks($id)
    {
        return new Response(true, "packs", Connection::execSelect("SELECT * FROM Medals_Solutions_Beatmaps_Packs WHERE Medal_ID = ?", "i", [$id]));
    }

    public static function GetBeatmaps($medal_id, $single = null): Response
    {
        $vars = "i";
        $inp = [$medal_id];

        if ($single !== null) {
            $vars .= "i";
            $inp[] = $single;
        }
        if (Session::LoggedIn()) {
            $vars = "i" . $vars;
            array_unshift($inp, Session::UserData()['id']);
        }

        return new Response(true, "beatmaps", Connection::execSelect("
    SELECT Medals_Beatmaps.*, Beatmaps_Data.*, COUNT(Common_Votes.User_ID) AS VoteCount"
            . (Session::LoggedIn() ? ", (SELECT COUNT(Common_Votes.User_ID) 
 FROM Common_Votes 
 WHERE Common_Votes.User_ID = ? 
 AND Common_Votes.Target_Table = 'Medals_Beatmaps' 
 AND Common_Votes.Target_ID = Medals_Beatmaps.ID) AS HasVoted " : "") .
            " FROM Medals_Beatmaps 
    LEFT JOIN Beatmaps_Data ON Medals_Beatmaps.Beatmap_ID = Beatmaps_Data.Beatmap_ID
    LEFT JOIN Common_Votes ON Common_Votes.Target_Table = 'Medals_Beatmaps' AND Common_Votes.Target_ID = Medals_Beatmaps.ID
    WHERE Medals_Beatmaps.Medal_ID = ? AND Medals_Beatmaps.Deleted = 0" . ($single == null ? "" : " AND Medals_Beatmaps.Beatmap_ID = ? ") . " GROUP BY Medals_Beatmaps.Beatmap_ID  ORDER BY VoteCount DESC, Medals_Beatmaps.ID DESC", $vars, $inp));
    }

    public static function ReportBeatmap($id, $data)
    {
        $beatmapInfo = self::GetOneBeatmap($id);
        $beatmapInfo = self::GetBeatmaps($beatmapInfo['Medal_ID'], $beatmapInfo['Beatmap_ID'])->content[0];
        $medalInfo = Medals::Get($beatmapInfo['Medal_ID']);


        $user_name = "Anonymous";
        $user_id = 0;

        if(Session::LoggedIn()) {
            $user_name = Session::UserData()['username'];
            $user_id = Session::UserData()['id'];
        }

        $message = (new DiscordEmbedMessage())
            ->setColor(0xff66aa)
            ->setContent('Report from ' . $user_name)
            ->setAvatar('https://a.ppy.sh/' . $user_id)
            ->setUsername('BEATMAP')
            ->setTitle($beatmapInfo['Song_Title'] . ' - ' . $beatmapInfo['Song_Artist'] . ' (by ' . $beatmapInfo['Mapper_Name'] . ') [' . $beatmapInfo['Difficulty_Name'] . '}')
            ->setDescription($data['reason'])
            ->setUrl(URL . "/medals/" . urlencode($medalInfo['Name']))
            ->setFooterText($medalInfo['Name'])
            ->setFooterIcon(URL . "/assets/osu/web/" . $medalInfo['Link']);

        $webhook = new DiscordWebhook(MOD_WEBHOOK);
        $messageData = $webhook->send($message);

        return new Response(true, "ok");
    }

    public static function WipeBeatmapCache($medal_id)
    {
        //  Memcache::remove("medals_beatmaps_" . $medal_id);
    }

    public static function GetOneBeatmap($id)
    {
        $comment = Connection::execSelect("SELECT * FROM Medals_Beatmaps WHERE ID = ?", "i", [$id]);
        if (count($comment) > 0) return $comment[0];
        return null;
    }
}