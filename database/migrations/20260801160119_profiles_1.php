<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Profiles1 extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        $this->table('Profiles_Data', ['id' => false, 'primary_key' => ['User_ID']])
            ->addColumn('User_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Bio', 'text', ['null' => true])
            ->addColumn('Favourite_Medal', 'integer', ['null' => true, 'signed' => false])
            ->addIndex('User_ID', ['unique' => true])
            ->addIndex('Favourite_Medal')
            ->save();

        $this->table('Profiles_Goals', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('User_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Value', 'string', ['null' => false, 'limit' => 200])
            ->addColumn('Type', 'string', ['null' => false, 'limit' => 50])
            ->addColumn('Gamemode', 'string', ['null' => true, 'limit' => 20])
            ->addColumn('Creation_Date', 'datetime', ['null' => false])
            ->addColumn('Claimed', 'datetime', ['null' => true])
            ->addIndex('User_ID')
            ->addIndex(['User_ID', 'Value', 'Type', 'Gamemode'], ['unique' => true])
            ->save();

        $this->table('Profiles_Timeline', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('User_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Date', 'date', ['null' => false])
            ->addColumn('Note', 'string', ['null' => false, 'limit' => 500])
            ->addColumn('Mode', 'string', ['null' => true, 'limit' => 50])
            ->addIndex('User_ID')
            ->addIndex(['User_ID', 'Date', 'Note', 'Mode'], ['unique' => true])
            ->save();

        $this->table('Profiles_Hardware', ['id' => false, 'primary_key' => ['User_ID', 'Hardware_ID']])
            ->addColumn('User_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Hardware_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Custom_Name', 'string', ['null' => true])
            ->addColumn('Description', 'text', ['null' => true])
            ->addColumn('Variant', 'string', ['null' => true])
            ->addIndex('User_ID')
            ->addIndex('Hardware_ID')
            ->save();

        // vendors (nvidia, amd, logitech, etc)
        $this->table('System_Hardware_Vendors', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('Name', 'string', ['null' => false])
            ->addIndex('Name', ['unique' => true])
            ->save();

        // models themselves
        $this->table('System_Hardware_Models', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('Vendor_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Name', 'string', ['null' => false])
            ->addColumn('Category', 'integer', ['null' => false, 'signed' => false])
            ->addIndex('Vendor_ID')
            ->addIndex('Category')
            ->addIndex(['Vendor_ID', 'Name'], ['unique' => true])
            ->save();

        // link to buy (affiliate?)
        $this->table('System_Hardware_Models_Links', ['id' => true])
            ->addColumn('Model_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Vendor_ID', 'integer', ['null' => false, 'signed' => false])
            ->addColumn('Link', 'string', ['null' => false, 'limit' => 512])
            ->addIndex('Model_ID')
            ->addIndex('Vendor_ID')
            ->save();

        $this->table('System_Hardware_Categories', ['id' => false, 'primary_key' => ['ID']])
            ->addColumn('ID', 'integer', ['null' => false, 'signed' => false, 'identity' => true])
            ->addColumn('Name', 'string', ['null' => false])
            ->addIndex('Name', ['unique' => true])
            ->save();
    }
}