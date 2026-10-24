<?php

namespace Data\Notifications;

use API\Response;
use Database\Connection;
use Database\Session;

class Utils
{
    static function SendNotification(int $from, int|array $to, NotificationRef $ref, NotificationType $type): void
    {
        $recipients = array_unique(is_array($to) ? $to : [$to]);

        foreach ($recipients as $to_i) {
            Connection::execOperation("INSERT INTO `Notifications` (`SenderID`, `ReceiverID`, `Type`, `Ref_Users`, `Ref_Medals`, `Ref_Snapshots`, `Ref_Comments`, `Ref_Comments_Reply`, `Date`, `Read`, `Dismissed`)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, now(), '0', '0')", "iisiiiii", [$from, $to_i, $type->type, $ref->users, $ref->medals, $ref->snapshots, $ref->comments, $ref->comments_reply]);
        }
    }

    static function CleanNotif($item) {
        $item['Ref_Users_Data'] = json_decode($item['Ref_Users_Data'], true);
        $item['Ref_Medals_Data'] = json_decode($item['Ref_Medals_Data'], true);
        $item['Ref_Snapshots_Data'] = json_decode($item['Ref_Snapshots_Data'], true);
        $item['Ref_Comments_Data'] = json_decode($item['Ref_Comments_Data'], true);
        $item['SenderData'] = json_decode($item['SenderData'], true);
        $item['Ref_Comments_Reply_Data'] = json_decode($item['Ref_Comments_Reply_Data'], true);
        return $item;
    }
    static function Get($limit = 50, $offset = 0)
    {
        $items = Connection::execSelect("SELECT * FROM DYN_Notifications WHERE ReceiverID = ? AND SenderID != ? ORDER BY DYN_Notifications.Date DESC LIMIT ? OFFSET ?", "iiii", [Session::UserData()['id'], Session::UserData()['id'], $limit, $offset]);
        foreach ($items as &$item) {
            $item = self::CleanNotif($item);
        }
        return new Response(true, "ok", $items);
    }

    static function UnreadCount()
    {
        return (Connection::execSelect("SELECT COUNT(*) as c FROM Notifications WHERE Notifications.Read = 0 AND Notifications.ReceiverID = ? AND SenderID != ?", "ii", [Session::UserData()['id'], Session::UserData()['id']]))[0]['c'];
    }

    public static function SetRead($items)
    {
        $userID = Session::UserData()['id'];

        $ids = array_map(function ($item) {
            return $item->ID;
        }, $items);

        if (!empty($ids)) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));

            $query = "UPDATE Notifications SET `Read` = 1 WHERE `ID` IN ($placeholders) AND `ReceiverID` = ?";

            $params = array_merge($ids, [$userID]);

            $types = str_repeat('i', count($ids)) . 'i';

            Connection::execOperation($query, $types, $params);
        }
    }
}