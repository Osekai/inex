<?php

namespace Data;

use Database\Connection;
use Database\Session;
use Exception;

class OsekaiUsers
{
    static function GetUser($userid, $gamemode) {
        return \Caching::Layer("osekaiuser_" . $userid, function() use ($userid, $gamemode) {
            try {
                $data = \API\Osu\User::GetUser($userid, $gamemode);

                $data['page'] = null;

                $groups = Connection::execSelect("SELECT * FROM System_Roles_Assignments 
            LEFT JOIN System_Roles_Roles ON System_Roles_Roles.ID = System_Roles_Assignments.Role_ID
            WHERE User_ID = ?", "i", [$data['id']]);

                $data['Roles'] = $groups;

                $permissions = [];
                $permissions_blocked = [];
                foreach ($groups as $group) {
                    $blockedpermissions = json_decode($group['Blocked_Permissions'], true);
                    $permissions = json_decode($group['Permissions'], true);
                    foreach ($blockedpermissions as $perm) $permissions_blocked[] = $perm;
                    foreach ($permissions as $perm) $permissions[] = $perm;

                    // people don't need to know what specific permissions each group gets.
                    unset($group['BlockedPermissions']);
                    unset($group['Permissions']);
                }
                $data['Permissions'] = array_unique($permissions);
                $data['BlockedPermissions'] = array_unique($permissions_blocked);

                return $data;
            } catch(Exception $exception) {
                return null;
            }
        }, 6000);
    }

    public static function CheckPermissionArray($permission, $array, $default = false)
    {
        $parts = explode(".", $permission);
        foreach ($array as $perm) {
            $split = explode(".", $perm);
            for ($y = 0; $y < count($split); $y++) {
                if ($split[$y] == "*" && $y <= count($parts) - 1) {
                    return true;
                }
                if ($split[$y] != $parts[$y]) {
                    break;
                }
                if ($split[$y] == $parts[$y] && $y == count($parts) - 1) {
                    return true;
                }
            }
        }

        return $default;
    }
    public static function HasPermission($permission, $default = false, $userid = null)
    {
        $user = null;
        if($userid == null) {
            $user = Session::UserData();
        } else {
            $user = self::GetUser($userid, true);
        }

        if (self::CheckPermissionArray($permission, $user['Blocked_Permissions'])) {
            // this permission is blocked, do not allow
            return false;
        }


        return self::CheckPermissionArray($permission, $user['Permissions'], $default);
    }

}