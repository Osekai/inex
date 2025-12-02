<?php

namespace Tasks\Runners;

use Database\Connection;
use Tasks\AbstractRunner;

class Votes extends AbstractRunner
{
    public function etirun($args): void
    {
        $votes = $this->eclipse_db->execSimpleSelect("SELECT * FROM Votes LEFT JOIN Beatmaps ON Beatmaps.ID = Votes.ObjectID");

        $newVotes = [];
        foreach($votes as $vote) {
            $target = "Common_Comments";
            $id = $vote['ObjectID'];
            if($vote['Type'] == 0) {
                $target = "Medals_Beatmaps";
                $beatmap = Connection::execSelect("SELECT * FROM Medals_Beatmaps LEFT JOIN Medals_Data ON Medals_Data.Medal_ID = Medals_Beatmaps.Medal_ID WHERE Medals_Data.Name = ? AND Beatmap_ID = ? AND Medals_Beatmaps.Beatmap_Submitted_User_ID = ?", "sii", [$vote['MedalName'], $vote['BeatmapID'], $vote['SubmittedBy']]);
                if(count($beatmap) == 0) {
                    //echo "Skipping vote " . $vote['ID'] . " - can't find beatmap " . $vote['BeatmapID'] . "\n";
                    continue;
                }
                $id = $beatmap[0]['ID'];
            }
            $new = [
                "Target_ID" => $id,
                "Target_Table" => $target,
                "User_ID" => $vote['UserID']
            ];
            if(in_array($new, $newVotes)) {
                echo "Vote is already in database\n";
            } else {
                $newVotes[] = $new;
            }
        }


        $posts = $this->table('Common_Votes');
        $posts->truncate();
        $posts->insert($newVotes)
            ->saveData();
    }
}