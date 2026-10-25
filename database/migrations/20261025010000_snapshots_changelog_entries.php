<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SnapshotsChangelogEntries extends AbstractMigration
{
    public function up(): void
    {
        $this->table('Snapshots_Changelog', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('Text', 'text', ['null' => false])
            ->addColumn('Type', 'string', ['null' => false, 'limit' => 16])
            ->addColumn('Branch', 'string', ['null' => false, 'limit' => 64])
            ->addColumn('Author', 'string', ['null' => true, 'limit' => 64])
            ->addColumn('Area', 'string', ['null' => true, 'limit' => 64])
            ->addColumn('Date', 'date', ['null' => false])
            ->addIndex(['Branch', 'Date'])
            ->create();

        // official changelog export from an osu! dev, only has dates, no versions
        $file = fopen(__DIR__ . '/../data/releases_official_changelog.csv', 'r');
        $header = fgetcsv($file);

        $rows = [];
        while (($line = fgetcsv($file)) !== false) {
            if (count($line) != count($header)) continue;
            $entry = array_combine($header, $line);

            $area = $entry['area'];
            if ($area === "") $area = null;
            $author = $entry['author'];
            if ($author === "") $author = null;

            $rows[] = [
                'ID' => (int)$entry['id'],
                'Text' => $entry['text'],
                'Type' => $entry['type'],
                'Branch' => $entry['branch'],
                'Author' => $author,
                'Area' => $area,
                'Date' => $entry['created_at'],
            ];

            if (count($rows) >= 500) {
                $this->table('Snapshots_Changelog')->insert($rows)->saveData();
                $rows = [];
            }
        }
        fclose($file);

        if (count($rows) > 0) {
            $this->table('Snapshots_Changelog')->insert($rows)->saveData();
        }
    }

    public function down(): void
    {
        $this->table('Snapshots_Changelog')->drop()->save();
    }
}
