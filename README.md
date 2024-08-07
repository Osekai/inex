# setup
### MAKE SURE TO SETUP YOUR `config.php` FIRST

## db setup:
`php vendor/bin/phinx migrate`
`php vendor/bin/phinx seed:run`

## eclipse to inex
`php index.php eti all`

make sure that your config.php has valid settings for eclipse adapter

# new migration
`vendor/bin/phinx create Base`