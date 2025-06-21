<?php

namespace Tasks\Runners;

use Database\Connection;
use Tasks\AbstractRunner;

class RoleAssignments extends AbstractRunner
{
    public function etirun($args): void
    {
        $roles = $this->eclipse_db->execSimpleSelect("SELECT * FROM GroupAssignments");

        $mapping = [
            1 => 90,
            2 => 100,
            3 => 100,
            4 => null,
            5 => 10,
            6 => 1,
            7 => 2,
            8 => 3,
            9 => null,
            10 => null,
            11 => 90,
            12 => null,
            13 => null,
            14 => null
        ];

        $assignments = [];
        $seen = []; // To track unique combinations

        foreach($roles as $assignment) {
            $role = $mapping[$assignment['GroupId']];
            if($role == null) continue;

            // Create a unique key from User_ID and Role_ID
            $key = $assignment['UserId'] . '_' . $role;

            // Only add to $assignments if this combination has not been seen
            if (!isset($seen[$key])) {
                $assignments[] = [
                    "User_ID" => $assignment['UserId'],
                    "Role_ID" => $role,
                ];
                $seen[$key] = true; // Mark this combination as seen
            }
        }



        $posts = $this->table('System_Roles_Assignments');
        $posts->truncate();
        $posts->insert($assignments)
            ->saveData();
    }
}