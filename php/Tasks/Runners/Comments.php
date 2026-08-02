<?php

namespace Tasks\Runners;

use Tasks\AbstractRunner;

class Comments extends AbstractRunner
{
    public function etirun($args): void
    {
        echo "hi";
        $types = [
            //"medals" => [
            //    "column" => "MedalID",
            //    "target_table" => "Medals_Data"
            //],
            "profiles" => [
                "column" => "ProfileID",
                "target_table" => "Profiles_Data"
            ]
        ];
        $type = $types[$args[0]];

        print_r($type);

        $comments = $this->eclipse_db->execSimpleSelect("SELECT * FROM Comments WHERE {$type['column']} IS NOT NULL");

        $newComments = [];
        foreach($comments as $comment) {

            $newComments[] = [
                "ID" => $comment['ID'],
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
        echo "Inserted " . count($newComments) . " comments\n";
    }
}