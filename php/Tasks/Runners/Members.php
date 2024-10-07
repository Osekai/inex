<?php

namespace Tasks\Runners;

use Database\Connection;
use Tasks\AbstractRunner;

class Members extends AbstractRunner
{
    public function etirun($args): void
    {
        $members = [];

        function AddMember(&$members, $id, $name, $joindate = null) {
            // Flag to check if the member already exists
            $userExists = false;

            // Loop through existing members
            foreach ($members as &$member) {
                if ($member['User_ID'] === $id) {
                    // User already exists, check the join date
                    if (!is_null($joindate) && (isset($member['Joined_Date']) && strtotime($joindate) < strtotime($member['Joined_Date']))) {
                        // Update the member with the older join date
                        $member['Name'] = $name;
                        $member['Joined_Date'] = $joindate;
                    }
                    // User found, break the loop
                    $userExists = true;
                    break;
                }
            }

            // If user does not exist, add them
            if (!$userExists) {
                $members[] = [
                    "User_ID" => $id,
                    "Name" => $name,
                    "Joined_Date" => $joindate
                ];
            }
        }


        echo "Fetching from comments... ";
        $members_comments = $this->eclipse_db->execSimpleSelect("SELECT Ranking.id, Ranking.name, Comments.ID, Comments.PostDate
FROM Comments
LEFT JOIN Ranking ON Comments.UserID = Ranking.id
WHERE Comments.PostDate = (
    SELECT MIN(c2.PostDate)
    FROM Comments c2
    WHERE c2.UserID = Comments.UserID
);");
        $count = 0;
        foreach($members_comments as $m) {
            if($m['name'] !== null) {
                $count++;
                AddMember($members, $m['id'], $m['name'], $m['PostDate']);
            }
        }
        echo "Got " . $count . "\n";

        echo "Fetching from beatmaps... ";
        $members_beatmaps = $this->eclipse_db->execSimpleSelect("SELECT Ranking.id, Ranking.name, Beatmaps.SubmissionDate, Beatmaps.SubmittedBy
FROM Beatmaps
LEFT JOIN Ranking ON Beatmaps.SubmittedBy = Ranking.id
WHERE Beatmaps.SubmissionDate = (
    SELECT MIN(c2.SubmissionDate)
    FROM Beatmaps c2
    WHERE c2.SubmittedBy = Beatmaps.SubmittedBy
);");
        $count = 0;
        foreach($members_beatmaps as $m) {
            if($m['name'] !== null) {
                $count++;
                AddMember($members, $m['id'], $m['name'], $m['SubmissionDate']);
            }
        }
        echo "Got " . $count . "\n";


        echo "Fetching from favourite medals... ";
        $members_favs = $this->eclipse_db->execSimpleSelect("SELECT Ranking.id, Ranking.name, FavouriteMedals.user_id
FROM FavouriteMedals
LEFT JOIN Ranking ON FavouriteMedals.user_id = Ranking.id");
        $count = 0;
        foreach($members_favs as $m) {
            if($m['name'] !== null) {
                $count++;
                AddMember($members, $m['id'], $m['name'], null);
            }
        }
        echo "Got " . $count . "\n";

        echo "Fetching from goals... ";
        $members_goals = $this->eclipse_db->execSimpleSelect("SELECT Ranking.id, Ranking.name, Goals.CreationDate, Goals.UserID
FROM Goals
LEFT JOIN Ranking ON Goals.UserID = Ranking.id
WHERE Goals.CreationDate = (
    SELECT MIN(c2.CreationDate)
    FROM Goals c2
    WHERE c2.UserID = Goals.UserID
);");
        $count = 0;
        foreach($members_goals as $m) {
            if($m['name'] !== null) {
                $count++;
                AddMember($members, $m['id'], $m['name'], $m['CreationDate']);
            }
        }
        echo "Got " . $count . "\n";

        $posts = $this->table('System_Users');
        $posts->truncate();
        $posts->insert($members)
            ->saveData();
    }
}