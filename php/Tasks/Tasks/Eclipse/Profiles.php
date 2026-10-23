<?php

declare(strict_types=1);

namespace Tasks\Tasks\Eclipse;

use Data\Profiles\Goals;
use Data\Profiles\Timeline;
use Database\Connection;
use Tasks\EclipseTask;


class Profiles extends EclipseTask
{
    private const CHUNK_SIZE = 1000;

    public function Run(): void
    {
        // goals already there means this has run before (or inex is live), so don't wipe it by accident
        $argv = $GLOBALS['argv'] ?? [];
        $bypass = in_array("bypass", array_slice($argv, 3), true);
        $existing = Connection::execSimpleSelect("SELECT COUNT(*) AS Count FROM Profiles_Goals")[0]['Count'];
        if ($existing > 0 && !$bypass) {
            $this->Log("Profiles_Goals already has " . $existing . " goals, refusing to run because this wipes them.");
            $this->Log("Run it again with bypass on the end to go ahead: php index.php task Eclipse.Profiles bypass");
            return;
        }

        // dev only - wipe before transferring, remove once inex is live
        $this->table('Profiles_Goals')->truncate();
        $this->table('Profiles_Timeline')->truncate();
        $this->table('Profiles_Visits')->truncate();
        Connection::execOperation("DELETE FROM Common_Comments WHERE Target_Table = ?", "s", ["Profiles_Data"]);

        $this->transferGoals();
        $this->transferTimeline();
        $this->transferVisits();
        $this->transferComments();
    }

    private function transferGoals(): void
    {
        $goals = $this->eclipse_db->execSimpleSelect("SELECT * FROM Goals");

        $data = [];
        $skipped = 0;
        foreach ($goals as $goal) {
            $type = $this->keyify($goal['Type']);

            if (!$this->goalValueIsSane($type, $goal['Value'])) {
                $skipped++;
                continue;
            }

            // medals and badges aren't per mode, old data saved one anyway
            $gamemode = $this->fixGamemode($goal['Gamemode']);
            if ($type == "medals" || $type == "badges") {
                $gamemode = null;
            }

            $data[] = [
                "ID" => $goal['ID'],
                "User_ID" => $goal['UserID'],
                "Value" => $goal['Value'],
                "Type" => $type,
                "Gamemode" => $gamemode,
                "Creation_Date" => $goal['CreationDate'],
                "Claimed" => $goal['Claimed'],
            ];
        }

        if ($skipped > 0) echo "goals: skipped $skipped broken goals" . PHP_EOL;

        $data = $this->dedupeGoals($data);

        $this->insertChunked('Profiles_Goals', $data);
        echo "goals: transferred " . count($data) . PHP_EOL;
    }

    private function transferTimeline(): void
    {
        $timeline = $this->eclipse_db->execSimpleSelect("SELECT * FROM Timeline");

        $joinDates = $this->fetchJoinDates();

        $data = [];
        $skipped = 0;
        foreach ($timeline as $entry) {
            if (!$this->timelineDateIsSane($entry['Date'], $joinDates[$entry['UserID']] ?? null)) {
                $skipped++;
                continue;
            }

            $data[] = [
                "ID" => $entry['ID'],
                "User_ID" => $entry['UserID'],
                "Date" => $entry['Date'],
                "Note" => $entry['Note'],
                "Mode" => $this->fixGamemode($entry['Mode']),
            ];
        }

        if ($skipped > 0) echo "timeline: skipped $skipped entries with impossible dates" . PHP_EOL;

        $this->insertChunked('Profiles_Timeline', $data);
        echo "timeline: transferred " . count($data) . PHP_EOL;
    }

    private function transferVisits(): void
    {
        $visits = $this->eclipse_db->execSimpleSelect("SELECT * FROM ProfilesVisited");

        $data = [];
        foreach ($visits as $visit) {
            $data[] = [
                "Visitor_User_ID" => $visit['visited_by'],
                "Visited_User_ID" => $visit['visited_id'],
                "Date" => $visit['date'],
            ];
        }

        $this->insertChunked('Profiles_Visits', $data);
        echo "visits: transferred " . count($data) . PHP_EOL;
    }

    private function transferComments(): void
    {
        $comments = $this->eclipse_db->execSimpleSelect("SELECT * FROM Comments WHERE ProfileID IS NOT NULL");

        // eclipse ids can clash with comments made on inex, so shift them all past the current highest id
        // parents get shifted the same way so replies stay attached
        $offset = (int)Connection::execSimpleSelect("SELECT COALESCE(MAX(ID), 0) AS Max_ID FROM Common_Comments")[0]['Max_ID'];

        $data = [];
        foreach ($comments as $comment) {
            $parent = $comment['ParentComment'];
            if (!empty($comment['ParentComment'])) {
                $parent = $comment['ParentComment'] + $offset;
            }

            $data[] = [
                "ID" => $comment['ID'] + $offset,
                "Target_ID" => $comment['ProfileID'],
                "Target_Table" => "Profiles_Data",
                "User_ID" => $comment['UserID'],
                "Parent_Comment_ID" => $parent,
                "Text" => $comment['PostText'],
                "Date" => $comment['PostDate'],
                "Is_Pinned" => $comment['Pinned'],
            ];
        }

        $this->insertChunked('Common_Comments', $data);
        echo "comments: transferred " . count($data) . PHP_EOL;
    }

    // join dates come from the rankings table, users without one skip the join check
    private function fetchJoinDates(): array
    {
        $rows = Connection::execSimpleSelect("SELECT ID, Join_Date FROM Rankings_Users WHERE Join_Date IS NOT NULL");

        $joinDates = [];
        foreach ($rows as $row) {
            $joinDates[$row['ID']] = substr($row['Join_Date'], 0, 10);
        }

        echo "timeline: got join dates for " . count($joinDates) . " users" . PHP_EOL;
        return $joinDates;
    }

    // before osu existed, in the future, or before the account was made
    private function timelineDateIsSane(string $date, ?string $joinDate): bool
    {
        $date = substr($date, 0, 10);

        if ($date < Timeline::EARLIEST_DATE) return false;
        if ($date > date("Y-m-d")) return false;
        if ($joinDate !== null && $date < $joinDate) return false;

        return true;
    }

    // catches negative, zero, non numbers, infinite and silly big goals
    private function goalValueIsSane(string $type, $value): bool
    {
        if (!is_numeric($value)) return false;

        $number = (float)$value;
        if (is_nan($number) || is_infinite($number)) return false;
        if ($number <= 0) return false;

        // same limits the goals api uses
        $types = Goals::Types();
        $limit = $types[$type]['Max'] ?? Goals::DEFAULT_MAX;

        return $number <= $limit;
    }

    // old data uses "fruits", inex uses "catch"
    private function fixGamemode(?string $mode): ?string
    {
        if ($mode === "fruits") return "catch";

        // all mode is gone, so these aren't tied to a mode anymore
        if ($mode === "all" || $mode === "null" || $mode === "") return null;
        return $mode;
    }

    // keyifying can squash two old types into one, so merge them
    // prefers the claimed one, otherwise the oldest
    private function dedupeGoals(array $goals): array
    {
        $kept = [];
        $dropped = 0;

        foreach ($goals as $goal) {
            $key = implode("|", [$goal['User_ID'], $goal['Value'], $goal['Type'], $goal['Gamemode'] ?? ""]);

            if (!isset($kept[$key])) {
                $kept[$key] = $goal;
                continue;
            }

            $dropped++;
            $existing = $kept[$key];
            $existingClaimed = $existing['Claimed'] !== null;
            $newClaimed = $goal['Claimed'] !== null;

            if ($newClaimed && !$existingClaimed) {
                $kept[$key] = $goal;
            } else if ($newClaimed === $existingClaimed && $goal['Creation_Date'] < $existing['Creation_Date']) {
                $kept[$key] = $goal;
            }
        }

        if ($dropped > 0) echo "goals: merged $dropped duplicates" . PHP_EOL;
        return array_values($kept);
    }

    // "SS Count" -> "ss-count"
    private function keyify(string $str): string
    {
        $str = strtolower(trim($str));

        // the % would get stripped and clash with "medals"
        if ($str == "% medals") return "medals-percent";

        $str = preg_replace('/[^a-z0-9]+/', '-', $str);
        return trim($str, '-');
    }

    // one giant insert can hit max_allowed_packet, so split it up
    private function insertChunked(string $tableName, array $rows): void
    {
        if (empty($rows)) return;

        $table = $this->table($tableName);
        foreach (array_chunk($rows, self::CHUNK_SIZE) as $chunk) {
            $table->insert($chunk)->saveData();
        }
    }
}