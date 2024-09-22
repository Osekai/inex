<?php

namespace eti\runners;

use eti\AbstractRunner;

class Comments extends AbstractRunner
{
    public function etirun($args): void
    {
        $types = [
            "medals" => [
                "column" => "MedalID",
                "target_table" => "Medals_Data"
            ]
        ];
        $type = $types[$args[0]];

        print_r($type);

        $comments = $this->eclipse_db->execSimpleSelect("SELECT * FROM Comments WHERE {$type['column']} IS NOT NULL");

        $newComments = [];
        foreach($comments as $comment) {
            $newComments[] = [
                "Target_ID" => $comment[$type["column"]],
                "Target_Table" => $type['target_table'],
                "User_ID" => $comment['UserID'],
                "Parent_Comment_ID" => $comment['ParentComment'],
                "Text" => $comment['PostText'],
                "Date" => $comment['PostDate'],
                "Is_Pinned" => $comment['Pinned']
            ];
        }


        $posts = $this->table('Common_Comments');
        $posts->insert($newComments)
            ->saveData();
    }
}