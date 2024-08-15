<?php

namespace Data;

use API\Response;
use Database\Connection;
use Database\Session;

class Comment
{
    public int $id;
    public string $section_id;
    public string $content;
    public array $children = [];
    public ?int $parent;
    public string $date;
    public array $poster;

    public function __construct($content)
    {
        $this->id = $content['CommentID'];
        $this->section_id = $content['ID'];
        $this->poster = [
            "id" => $content['Poster'],
            "pfptime" => $content['PfpTime'],
            "name" => $content['Name'],
            "tag" => $content['Tag']
        ];
        $this->parent = $content['Parent'];
        $this->content = $content['Content'];
        $this->date = $content['DatePosted'];
    }

    public function addChild(Comment $child): void
    {
        $this->children[] = $child;
    }

    // Function to search for a specific child comment
    public function searchChild($targetId): ?Comment
    {
        // Check if this comment is the target
        if ($this->id === $targetId) {
            return $this;
        }

        // Recursively search children
        foreach ($this->children as $child) {
            $found = $child->searchChild($targetId);
            if ($found !== null) {
                return $found;
            }
        }

        // If target not found in this branch, return null
        return null;
    }
}

class Comments
{

    public static function Get($section): Response
    {
        $cleaned = [];
        $data = Connection::execSelect("SELECT Comments.*, Users.Tag, Users.Name FROM Comments 
         LEFT JOIN Users ON Users.ID = Comments.Poster
         WHERE Comments.ID = ? AND Comments.Deleted = 0", "s", [$section]);

        foreach ($data as $comment) {
            if ($comment['Parent'] === null) {
                $cleaned[] = new Comment($comment);
            }
        }

        /** @var Comment $comment */
        foreach ($data as $comment) {
            if ($comment["Parent"] == null) continue;
            foreach ($cleaned as $clean) {
                $child = $clean->searchChild($comment["Parent"]);
                if ($child != null) {
                    $child->addChild(new Comment($comment)); // Change here
                    break;
                }
            }
        }
        return new Response(true, "success", $cleaned);
    }

    public static function Send($section, mixed $content, mixed $replyingTo)
    {
        Connection::execOperation("INSERT INTO `Comments` (`ID`, `Poster`, `Parent`, `Content`, `DatePosted`)
VALUES (?, ?, ?, ?, now());", "siis", [$section, Session::UserData()['ID'], $replyingTo, $content]);

        $comment = Connection::execSelect("SELECT Comments.*, Users.Tag, Users.Name, Users.PfpTime FROM Comments 
         LEFT JOIN Users ON Users.ID = Comments.Poster WHERE `Content` = ? AND Comments.ID = ? AND `Poster` = ? LIMIT 1", "ssi", [$content, $section, Session::UserData()['ID']])[0];
        return new Response(true, "success", new Comment($comment));
    }

    public static function Delete($id)
    {
        $comment = Connection::execSelect("SELECT Comments.CommentID, Comments.Poster FROM Comments WHERE CommentID = ?", "i", [$id]);
        if (count($comment) == 1) {
            $comment = $comment[0];
            if ($comment['Poster'] == Session::UserData()['ID']) {
                Connection::execOperation("UPDATE `Comments` SET `Deleted` = '1' WHERE `CommentID` = ?;", "i", [$id]);
                return new Response(true, "success");
            } else {
                return new Response(false, "no_perm");
            }
        } else {
            return new Response(false, "comment_does_not_exist");
        }
    }
}