<?php

namespace Data;

use Ampra\IO;
use API\Response;
use Data\Notifications\Types\Comment;
use Database\Connection;
use Database\Session;
use Woeler\DiscordPhp\Message\DiscordEmbedMessage;
use Woeler\DiscordPhp\Webhook\DiscordWebhook;


class Comments
{
    public static function Post(mixed $id, mixed $table, mixed $text, $replyingTo = null)
    {
        if (!Session::LoggedIn()) return new Response(false, "logged out");

        $valid_tables = ["Medals_Data", "Profiles_Data", "Custom"];
        if (!in_array($table, $valid_tables)) return new Response(false, "invalid_table");

        if (\CheckTargetValidity::Check($table, $id) == null) return new Response(false, "invalid_id");

        Connection::execOperation("INSERT INTO `Common_Comments` (`Target_ID`, `Target_Table`, `User_ID`, `Parent_Comment_ID`, `Text`, `Date`, `Is_Pinned`)
VALUES (?, ?, ?, ?, ?, now(), '0');", "isiis", [$id, $table, Session::UserData()['id'], $replyingTo, $text]);

        $comment = Connection::execSimpleSelect("SELECT * FROM `Common_Comments` WHERE ID = LAST_INSERT_ID()")[0];
        (new Comment($comment, $table === "Medals_Data" ? "medals" : "user"))->Send();

        $title = "";

        if($table === "Medals_Data") {
            $medal = Medals::Get($id);
            $title = $medal['Name'];
        }

        IO::Send("/comment", [
            "comment" => $comment,
            "user" => Session::UserData(),
            "url" => $table === "Medals_Data" ? "/medals/" . $id : "/user/" . $id,
            "title" => $title
        ]);


        return new Response(true, "", self::Get($id, $table, $replyingTo, $text)->content[0]);
    }

    public static function GetOne($id)
    {
        $comment = Connection::execSelect("SELECT * FROM Common_Comments WHERE ID = ? AND Deleted = 0", "i", [$id]);
        if (count($comment) > 0) return $comment[0];
        return null;
    }

    public static function Get(mixed $id, mixed $table, $parent = null, $single = null)
    {
        $valid_tables = ["Medals_Data", "Profiles_Data"];
        if (!in_array($table, $valid_tables)) return new Response(false, "invalid_table");

        if (\CheckTargetValidity::Check($table, $id) == null) return new Response(false, "invalid_id");

        $types = "is";
        $values = [$id, $table];


        if ($single !== null) {
            $types .= "s";
            $values[] = $single;
        }
        if ($parent != null) {
            $types .= "i";
            $values[] = $parent;
        }

        if (Session::LoggedIn()) {
            $types = "i" . $types; // Add the type for user ID
            array_unshift($values, Session::UserData()['id']); // Add the user ID to the beginning of $values
        }

        $query = "
SELECT Common_Comments.*, 
System_Users.Name AS Username,
Rankings_Users.Count_Medals AS Medals,
GROUP_CONCAT(DISTINCT System_Roles_Assignments.Role_ID SEPARATOR ',') AS Roles,
(SELECT COUNT(*) FROM Common_Comments AS Children WHERE Children.Parent_Comment_ID = Common_Comments.ID) AS Replies,
(SELECT COUNT(*) FROM Common_Votes WHERE Common_Votes.Target_Table = 'Common_Comments' AND Common_Votes.Target_ID = Common_Comments.ID) AS VoteCount " .
            (Session::LoggedIn() ? ", 
    (SELECT COUNT(Common_Votes.User_ID) 
    FROM Common_Votes 
    WHERE Common_Votes.User_ID = ? 
    AND Common_Votes.Target_Table = 'Common_Comments' 
    AND Common_Votes.Target_ID = Common_Comments.ID) AS HasVoted " : "") .
            " FROM Common_Comments 
            
LEFT JOIN System_Roles_Assignments ON System_Roles_Assignments.User_ID = Common_Comments.User_ID
LEFT JOIN System_Users ON System_Users.User_ID = Common_Comments.User_ID
LEFT JOIN Rankings_Users ON Rankings_Users.ID = Common_Comments.User_ID
WHERE Common_Comments.Target_ID = ? 
AND Common_Comments.Deleted = 0
AND Common_Comments.Target_Table = ? " .
            ($single == null ? "" : "AND Common_Comments.Text = ? ") .
            "AND Common_Comments.Parent_Comment_ID " .
            ($parent == null ? "IS NULL" : "= ?") . " 
GROUP BY Common_Comments.ID 
ORDER BY Is_Pinned DESC, VoteCount DESC, Replies DESC";


        return new Response(true, "ok", Connection::execSelect($query, $types, $values));
    }

    public static function Report($id, $data)
    {
        $comment = Comments::GetOne($id);

        $user_name = "Anonymous";
        $user_id = 0;

        if (Session::LoggedIn()) {
            $user_name = Session::UserData()['username'];
            $user_id = Session::UserData()['id'];
        }

        $message = (new DiscordEmbedMessage())
            ->setColor(0x66aaff)
            ->setContent('Report from ' . $user_name)
            ->setAvatar('https://a.ppy.sh/' . $user_id)
            ->setUsername('COMMENT')
            ->setTitle("Comment report on " . $data['url'])
            ->setDescription($data['reason'])
            ->setUrl($data['url'])
            ->addField("Comment Content", $comment['Text'])
            ->setFooterText($comment['Target_Table'] . ":" . $comment['Target_ID'])
            ->setFooterIcon("https://a.ppy.sh/" . $comment['User_ID']);

        $webhook = new DiscordWebhook(MOD_WEBHOOK);
        $messageData = $webhook->send($message);

        return new Response(true, "ok");
    }

    public static function AdminDelete($id)
    {
        if (!OsekaiUsers::HasPermission("comments.delete.any")) return new Response(false, "no");

        return self::Delete($id, true);
    }

    public static function Delete($id, $skipCheck = false)
    {
        if (!Session::LoggedIn()) return new Response(false, "logged out");

        $comment = self::GetOne($id);

        if ($comment['User_ID'] !== Session::UserData()['id'] && !$skipCheck) return new Response(false, "Not your comment, silly");

        Connection::execOperation("UPDATE Common_Comments SET Deleted = 1 WHERE ID = ?", "i", [$id]);

        return new Response(true, "ok");
    }

    public static function Pin($id)
    {
        if (!OsekaiUsers::HasPermission("comments.pin")) return new Response(false, "no");


        Connection::execOperation("UPDATE Common_Comments
SET Is_Pinned = IF(Is_Pinned = 1, 0, 1)
WHERE ID = ?", "i", [$id]);

        return new Response(true, "ok");
    }

    public static function GetItemFromComment($comment)
    {
        $ref = explode("_", $comment['ID']);
        if ($ref[0] == "medals") return Connection::execSelect("SELECT * FROM Medals_Data WHERE Medal_ID = ?", "i", [$ref[1]])[0];
        if ($ref[0] == "user") return Connection::execSelect("SELECT * FROM Rankings_Users WHERE ID = ?", "i", [$ref[1]])[0];
        throw new \Exception('Unexpected type ' . json_encode($ref));
    }
}
