<?php

declare(strict_types=1);

namespace Tasks\Runners;

use Tasks\AbstractRunner;


class Profiles extends AbstractRunner
{
    private const CHUNK_SIZE = 1000;

    public function etirun($args): void
    {
        // dev only - wipe before transferring, remove once inex is live
        $this->table('Profiles_Goals')->truncate();
        $this->table('Profiles_Timeline')->truncate();

        $this->transferGoals();
        $this->transferTimeline();
    }

    private function transferGoals(): void
    {
        $goals = $this->eclipse_db->execSimpleSelect("SELECT * FROM Goals");

        $data = [];
        foreach ($goals as $goal) {
            $type = $this->keyify($goal['Type']);

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

        $data = $this->dedupeGoals($data);

        $this->insertChunked('Profiles_Goals', $data);
        echo "goals: transferred " . count($data) . PHP_EOL;
    }

    private function transferTimeline(): void
    {
        $timeline = $this->eclipse_db->execSimpleSelect("SELECT * FROM Timeline");

        $data = [];
        foreach ($timeline as $entry) {
            $data[] = [
                "ID" => $entry['ID'],
                "User_ID" => $entry['UserID'],
                "Date" => $entry['Date'],
                "Note" => $entry['Note'],
                "Mode" => $this->fixGamemode($entry['Mode']),
            ];
        }

        $this->insertChunked('Profiles_Timeline', $data);
        echo "timeline: transferred " . count($data) . PHP_EOL;
    }

    // old data uses "fruits", inex uses "catch"
    private function fixGamemode(?string $mode): ?string
    {
        if ($mode === "fruits") return "catch";
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