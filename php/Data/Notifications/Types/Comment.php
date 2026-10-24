<?php

namespace Data\Notifications\Types;

use Data\Notifications\NotificationType;
use Database\Connection;

class Comment extends NotificationType
{
    public string $type = "comment";

    public function __construct($comment, $reftype)
    {
        parent::__construct();

        $this->ref->comments = $comment['ID'];

        switch ($reftype) {
            case "medals":
                $this->ref->medals = $comment['Target_ID'];
                break;
            case "snapshots":
                $this->ref->snapshots = $comment['Target_ID'];
                break;
            case "user":
                $this->to = [$comment['Target_ID']];
                $this->ref->users = $comment['Target_ID'];
                break;
            default:
                throw new \Exception('Unexpected value ' . $reftype);
        }

        if ($comment['Parent_Comment_ID'] !== null) {
            $this->type = "reply";
            $this->ref->comments_reply = $comment['Parent_Comment_ID'];

            $parent = Connection::execSelect("SELECT * FROM Common_Comments WHERE ID = ?", "i", [$comment['Parent_Comment_ID']])[0];
            $this->to = array_unique(array_merge((array)$this->to, [$parent['User_ID']]));
        }
    }
}